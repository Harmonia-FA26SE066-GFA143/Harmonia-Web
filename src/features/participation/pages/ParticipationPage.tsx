import { Alert, App, Avatar, Button, Card, Flex, Input, Popconfirm, Segmented, Table, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PickedProgramFeedback, usePickedProgram } from '@/features/liturgical-programs'
import { isPlanningDirector, LeadChoirNotice, NoChoirNotice, useEventChoirs } from '@/features/choirs'
import { useAllChoirMembers } from '@/features/members'
import { formatDateTime, vietnamToday } from '@/lib/api/dates'
import {
  CANCEL_LABEL,
  EmptyCell,
  EmptyChoir,
  EmptyState,
  EmptyWeek,
  ErrorState,
  Icon,
  inVoicePart,
  NoFilterResults,
  PageHeader,
  SectionSkeleton,
  StatusTag,
  UnassignedVoiceCell,
  voiceParts,
  type StatusTagColor,
} from '@/shared/ui'
import { nameInitial } from '@/shared/utils/personName'
import { matchesSearch } from '@/shared/utils/search'
import { colors, spacing, typography } from '@/styles/tokens'
import { ProgramPicker, ResponseSummary } from '../components/ResponseSummary'
import { ResponsesByPart } from '../components/ResponsesByPart'
import { SendRequestDrawer } from '../components/SendRequestDrawer'
import { useConfirmAllParticipation, useParticipation, useRemindParticipation, useSendParticipationRequests } from '../hooks/useParticipation'
import { participationErrorMessage } from '../participationErrors'
import { participationResponseLabels, type ParticipationRequest, type ParticipationResponse } from '../types'

type ResponseFilter = 'all' | ParticipationResponse | 'none' | 'note'

const responseColors: Record<ParticipationResponse, StatusTagColor> = { confirmed: 'green', unsure: 'gold', declined: 'red' }

/** Whether a request shows under the chosen filter tab. */
function inFilter(request: ParticipationRequest, filter: ResponseFilter) {
  if (filter === 'all') return true
  if (filter === 'none') return !request.response
  if (filter === 'note') return Boolean(request.note)
  return request.response === filter
}

/** The member's voice parts in words, from their approved skills. */
const partsOf = (skills: readonly string[]) => voiceParts.filter(({ pattern }) => inVoicePart(skills, pattern)).map(({ name }) => name).join(', ')

/** Skills are not part of a request; they come from the member profiles. */
const columnsFor = (skillsOf: Map<string, string[]>): TableColumnsType<ParticipationRequest> => [
  {
    key: 'name',
    title: 'Ca viên',
    render: (_, request) => (
      <Flex align="center" gap={spacing.md}>
        <Avatar aria-hidden style={{ background: colors.softSurface, color: colors.textMuted, fontWeight: 600, flexShrink: 0 }}>
          {nameInitial(request.fullName)}
        </Avatar>
        <Flex vertical align="start" gap={2}>
          <Typography.Text strong>{request.fullName}</Typography.Text>
          {request.hasTimeConflict && (
            // A warning only: assigning them in the roster would be refused (ROSTER_MEMBER_TIME_CONFLICT).
            <StatusTag color="gold" style={{ marginInlineEnd: 0 }}>
              Trùng giờ lễ khác
            </StatusTag>
          )}
        </Flex>
      </Flex>
    ),
  },
  {
    key: 'part',
    title: 'Bè',
    render: (_, request) => partsOf(skillsOf.get(request.memberId) ?? []) || <UnassignedVoiceCell />,
  },
  {
    key: 'response',
    title: 'Phản hồi',
    render: (_, request) =>
      request.response ? (
        <StatusTag color={responseColors[request.response]} style={{ marginInlineEnd: 0 }}>
          {participationResponseLabels[request.response]}
        </StatusTag>
      ) : (
        <StatusTag mark="draft" style={{ marginInlineEnd: 0 }}>
          Chưa phản hồi
        </StatusTag>
      ),
  },
  {
    key: 'respondedAt',
    title: 'Thời điểm',
    render: (_, request) =>
      request.respondedAt ? <Typography.Text>{formatDateTime(request.respondedAt)}</Typography.Text> : <EmptyCell />,
  },
  {
    key: 'note',
    title: 'Ghi chú',
    render: (_, request) => request.note ?? <EmptyCell />,
  },
]

/**
 * Choir Director: send participation confirmation requests for a liturgical program and follow the responses
 * (FE-06, FE-33–FE-34) on `/api/event-participations`. The Director picks the recipients; each member is asked once
 * per program, so a later send only reaches members not asked yet. This supersedes resending to non-responders
 * (decision 2026-09-29; owner decision 2026-10-07: follow the BE).
 * `?programId=` selects the program (link from the program detail), a past one included, read only; without it the
 * next upcoming program. A program the backend does not know is said so, never replaced by another one.
 * TBD: "real time" latency (FE-34) – the list refreshes on focus and with the refresh button.
 */
export function ParticipationPage() {
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const { programs, lookup, program, options: allPrograms, looking, missing } = usePickedProgram(searchParams.get('programId'))
  const today = vietnamToday()
  // No request for a program that is already past (decision 2026-09-30, 6a.3) or served by a non-lead director (D8).
  const isPast = program !== undefined && program.date < today
  const eventChoirs = useEventChoirs(program?.id)
  const isLead = eventChoirs.data ? isPlanningDirector(eventChoirs.data) : true
  const canWrite = !isPast && isLead
  const participation = useParticipation(program?.id)
  const send = useSendParticipationRequests(program?.id ?? '')
  const confirmAll = useConfirmAllParticipation(program?.id ?? '')
  const remind = useRemindParticipation(program?.id ?? '')
  const [picking, setPicking] = useState(false)
  const [filter, setFilter] = useState<ResponseFilter>('all')
  const [search, setSearch] = useState('')
  const members = useAllChoirMembers()
  const skillsOf = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.skills])), [members.data])
  const columns = useMemo(() => columnsFor(skillsOf), [skillsOf])

  const requests = useMemo(() => participation.data ?? [], [participation.data])
  const countResponses = (list: ParticipationRequest[]) => {
    const count = (response?: ParticipationResponse) => list.filter((request) => request.response === response).length
    return { sent: list.length, confirmed: count('confirmed'), unsure: count('unsure'), declined: count('declined'), none: count(), note: list.filter((request) => request.note).length }
  }
  // The summary counts every request; the filter tabs count the ones that match the search, like the list below them.
  const counts = useMemo(() => countResponses(requests), [requests])
  const searched = useMemo(
    () => requests.filter((request) => matchesSearch(search, request.fullName, ...(skillsOf.get(request.memberId) ?? []))),
    [requests, search, skillsOf],
  )
  const tabCounts = useMemo(() => countResponses(searched), [searched])
  // The first send; later sends only reach members not asked yet.
  const firstRequest = requests.reduce<string | undefined>((first, request) => (!first || request.requestedAt < first ? request.requestedAt : first), undefined)
  const invitedOn = firstRequest ? dayjs(firstRequest).format('DD/MM') : undefined
  const visible = searched.filter((request) => inFilter(request, filter))

  const handleSend = (memberIds?: string[]) =>
    send.mutate(memberIds, {
      onSuccess: () => {
        message.success(memberIds ? `Đã gửi yêu cầu xác nhận cho ${memberIds.length} thành viên.` : 'Đã gửi yêu cầu xác nhận cho các ca viên chưa được mời.')
        setPicking(false)
      },
      onError: (error) => message.error(participationErrorMessage(error, 'Không thể gửi yêu cầu. Vui lòng thử lại.')),
    })

  const handleRemind = () =>
    remind.mutate(undefined, {
      onSuccess: ({ remindedCount, pendingCount }) =>
        message.success(
          remindedCount === pendingCount
            ? `Đã nhắc ${remindedCount} thành viên chưa phản hồi.`
            : `Đã nhắc ${remindedCount} trong ${pendingCount} thành viên chưa phản hồi; những người còn lại vừa được nhắc gần đây.`,
        ),
      onError: (error) => message.error(participationErrorMessage(error, 'Không thể gửi lời nhắc. Vui lòng thử lại.')),
    })

  const handleConfirmAll = () =>
    confirmAll.mutate(undefined, {
      onSuccess: () => message.success('Đã xác nhận hộ các thành viên chưa phản hồi.'),
      onError: (error) => message.error(participationErrorMessage(error, 'Không thể xác nhận hộ. Vui lòng thử lại.')),
    })

  const sendButton = (
    <Button type="primary" icon={<Icon name="send" />} onClick={() => setPicking(true)} disabled={participation.data === undefined}>
      Gửi yêu cầu xác nhận
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Xác nhận tham gia"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Xác nhận tham gia' }]}
        description="Gửi lời mời xác nhận phục vụ, theo dõi phản hồi theo bè và nhắc ca viên chưa trả lời."
      />
      <PickedProgramFeedback
        programs={programs}
        lookup={lookup}
        looking={looking}
        missing={missing}
        onShowUpcoming={() => setSearchParams({})}
      />
      {programs.data !== undefined && !program && !searchParams.get('programId') && (
        <>
          <NoChoirNotice />
          <EmptyState icon={<EmptyWeek />} title="Chưa có chương trình phụng vụ" description="Yêu cầu xác nhận tham gia được gửi theo từng chương trình." />
        </>
      )}
      {program && (
        <Flex vertical gap={spacing.lg}>
          <div className="ctb-filters">
            <ProgramPicker program={program} programs={allPrograms} today={today} onPick={(programId) => setSearchParams({ programId })} />
            {requests.length > 0 && (
              <Segmented<ResponseFilter>
                aria-label="Lọc phản hồi"
                value={filter}
                onChange={setFilter}
                style={{ maxWidth: '100%', overflowX: 'auto' }}
                options={[
                  { value: 'all', label: `Tất cả (${tabCounts.sent})` },
                  { value: 'none', label: `Chưa phản hồi (${tabCounts.none})` },
                  { value: 'note', label: `Có ghi chú (${tabCounts.note})` },
                  { value: 'confirmed', label: `${participationResponseLabels.confirmed} (${tabCounts.confirmed})` },
                  { value: 'unsure', label: `${participationResponseLabels.unsure} (${tabCounts.unsure})` },
                  { value: 'declined', label: `${participationResponseLabels.declined} (${tabCounts.declined})` },
                ]}
              />
            )}
            {invitedOn && (
              <span className="ctb-filters__end">
                Lời mời gửi ngày {invitedOn} · {requests.length} ca viên
              </span>
            )}
          </div>
          <LeadChoirNotice eventId={program.id} />
          {participation.data !== undefined && requests.length > 0 && (
            <ResponseSummary
              counts={counts}
              activeFilter={filter}
              onSelectFilter={(next) => setFilter((current) => (current === next ? 'all' : next))}
            />
          )}
          {isPast && requests.length > 0 && (
            <Alert type="info" showIcon title="Chương trình đã qua: không gửi thêm yêu cầu xác nhận được." />
          )}
          {participation.isPending && <SectionSkeleton rows={8} label="Đang tải phản hồi" />}
          {participation.isError && (
            <ErrorState
              title="Không thể tải phản hồi xác nhận"
              error={participation.error} hasData={participation.data !== undefined} onRetry={() => participation.refetch()}
              retrying={participation.isFetching}
            />
          )}
          {participation.data !== undefined && requests.length === 0 && (
            <EmptyState
              icon={<EmptyChoir />}
              title="Chưa gửi yêu cầu xác nhận"
              description={
                isPast
                  ? 'Chương trình đã qua nên không gửi được yêu cầu xác nhận.'
                  : 'Chọn thành viên để gửi yêu cầu xác nhận tham gia phục vụ chương trình này.'
              }
              action={canWrite ? sendButton : undefined}
            />
          )}
          {participation.data !== undefined && requests.length > 0 && (
            <div className="hm-split">
              <Card styles={{ body: { padding: 0 } }}>
                <Flex vertical gap={spacing.sm} style={{ padding: spacing.lg, borderBottom: `1px solid ${colors.border}` }}>
                  <Flex wrap gap={spacing.sm} align="end" justify="space-between">
                    <Flex vertical gap={4} style={{ flex: '1 1 240px', maxWidth: 360 }}>
                      <label htmlFor="participation-search" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                        Tìm thành viên
                      </label>
                      <Input
                        id="participation-search"
                        allowClear
                        prefix={<Icon name="search" />}
                        placeholder="Họ tên hoặc kỹ năng…"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </Flex>
                    <Flex wrap gap={spacing.sm} align="center">
                      {/* The list reloads when the window is focused again or on request, so say how old it is. */}
                      <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                        Cập nhật lúc {dayjs(participation.dataUpdatedAt).format('HH:mm')}
                      </Typography.Text>
                      <Button
                        icon={<Icon name="refresh" />}
                        onClick={() => participation.refetch()}
                        loading={participation.isFetching && !send.isPending}
                      >
                        Làm mới
                      </Button>
                    </Flex>
                  </Flex>
                  <Flex wrap gap={spacing.sm} align="center">
                    <Button icon={<Icon name="send" />} onClick={() => setPicking(true)} disabled={!canWrite || send.isPending}>
                      Gửi thêm cho thành viên chưa được mời
                    </Button>
                    {counts.none > 0 && canWrite && (
                      <Button icon={<Icon name="notification" />} onClick={handleRemind} loading={remind.isPending}>
                        Nhắc người chưa phản hồi
                      </Button>
                    )}
                    {counts.none > 0 && canWrite && (
                      <Popconfirm
                        title={`Xác nhận hộ ${counts.none} thành viên chưa phản hồi?`}
                        description="Phản hồi Không tham gia và Chưa chắc chắn được giữ nguyên. Thành viên không nhận thông báo."
                        okText="Xác nhận hộ"
                        cancelText={CANCEL_LABEL}
                        onConfirm={handleConfirmAll}
                      >
                        <Button icon={<Icon name="check" />} loading={confirmAll.isPending}>
                          Xác nhận hộ người chưa phản hồi
                        </Button>
                      </Popconfirm>
                    )}
                  </Flex>
                </Flex>
                {visible.length === 0 ? (
                  <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
                    <NoFilterResults
                      onClearFilters={() => {
                        setFilter('all')
                        setSearch('')
                      }}
                    />
                  </div>
                ) : (
                  <Table<ParticipationRequest>
                    rowKey="memberId"
                    columns={columns}
                    dataSource={visible}
                    pagination={false}
                    scroll={{ x: 720 }}
                  />
                )}
              </Card>
              <ResponsesByPart requests={requests} skillsOf={skillsOf} programId={program.id} />
            </div>
          )}
        </Flex>
      )}
      {program && (
        <SendRequestDrawer
          open={picking}
          programId={program.id}
          excludedMemberIds={requests.map((request) => request.memberId)}
          sending={send.isPending}
          onSend={handleSend}
          onCancel={() => setPicking(false)}
        />
      )}
    </>
  )
}
