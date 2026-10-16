import { ReloadOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex, Input, Segmented, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, Link, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useUpcomingPrograms } from '@/features/liturgical-programs'
import { SkillTags, useChoirMembers } from '@/features/members'
import { formatDateTime } from '@/lib/api/dates'
import { EmptyState, ErrorState, MetricSummary, NoFilterResults, PageHeader, SectionSkeleton, StatusTag, type StatusTagColor } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, spacing, typography } from '@/styles/tokens'
import { SendRequestModal } from '../components/SendRequestModal'
import { useParticipation, useSendParticipationRequests } from '../hooks/useParticipation'
import { participationErrorMessage } from '../participationErrors'
import { participationResponseLabels, type ParticipationRequest, type ParticipationResponse } from '../types'

type ResponseFilter = 'all' | ParticipationResponse | 'none'

const responseColors: Record<ParticipationResponse, StatusTagColor> = { confirmed: 'green', unsure: 'gold', declined: 'red' }

const metrics = [
  { key: 'sent', label: 'Đã gửi yêu cầu' },
  { key: 'confirmed', label: participationResponseLabels.confirmed },
  { key: 'unsure', label: participationResponseLabels.unsure },
  { key: 'declined', label: participationResponseLabels.declined },
  { key: 'none', label: 'Chưa phản hồi' },
]

/** Skills are not part of a request; they come from the member profiles. */
const columnsFor = (skillsOf: Map<string, string[]>): TableColumnsType<ParticipationRequest> => [
  { key: 'name', title: 'Thành viên', render: (_, request) => <Typography.Text strong>{request.fullName}</Typography.Text> },
  { key: 'skills', title: 'Kỹ năng', render: (_, request) => <SkillTags skills={skillsOf.get(request.memberId) ?? []} /> },
  {
    key: 'requestedAt',
    title: 'Gửi yêu cầu lúc',
    render: (_, request) => (
      <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>{formatDateTime(request.requestedAt)}</Typography.Text>
    ),
  },
  {
    key: 'response',
    title: 'Phản hồi',
    render: (_, request) =>
      request.response ? (
        <Flex vertical gap={2} align="flex-start">
          <StatusTag color={responseColors[request.response]} style={{ marginInlineEnd: 0 }}>
            {participationResponseLabels[request.response]}
          </StatusTag>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
            {request.respondedAt ? formatDateTime(request.respondedAt) : '—'}
          </Typography.Text>
        </Flex>
      ) : (
        <Tag style={{ marginInlineEnd: 0 }}>Chưa phản hồi</Tag>
      ),
  },
  {
    key: 'note',
    title: 'Ghi chú của thành viên',
    render: (_, request) => request.note ?? <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>,
  },
]

/**
 * Choir Director: send participation confirmation requests for a liturgical program and follow the responses
 * (FE-06, FE-33–FE-34) on `/api/event-participations`. The Director picks the recipients; each member is asked once
 * per program, so a later send only reaches members not asked yet. This supersedes resending to non-responders
 * (decision 2026-09-29; owner decision 2026-10-07: follow the BE).
 * `?programId=` selects the program (link from the program detail); otherwise the next upcoming program.
 * TBD: "real time" latency (FE-34) – the list refreshes on focus and with the refresh button.
 */
export function ParticipationPage() {
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const programs = useUpcomingPrograms()
  const allPrograms = useMemo(() => programs.data ?? [], [programs.data])
  const program =
    allPrograms.find((item) => item.id === searchParams.get('programId')) ?? allPrograms[0]
  const today = dayjs().format('YYYY-MM-DD')
  // No request for a program that is already past (decision 2026-09-30, 6a.3).
  const isPast = program !== undefined && program.date < today
  const participation = useParticipation(program?.id)
  const send = useSendParticipationRequests(program?.id ?? '')
  const [picking, setPicking] = useState(false)
  const [filter, setFilter] = useState<ResponseFilter>('all')
  const [search, setSearch] = useState('')
  const members = useChoirMembers()
  const skillsOf = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.skills])), [members.data])
  const columns = useMemo(() => columnsFor(skillsOf), [skillsOf])

  const requests = useMemo(() => participation.data ?? [], [participation.data])
  const countResponses = (list: ParticipationRequest[]) => {
    const count = (response?: ParticipationResponse) => list.filter((request) => request.response === response).length
    return { sent: list.length, confirmed: count('confirmed'), unsure: count('unsure'), declined: count('declined'), none: count() }
  }
  // The summary counts every request; the filter tabs count the ones that match the search, like the list below them.
  const counts = useMemo(() => countResponses(requests), [requests])
  const searched = useMemo(
    () => requests.filter((request) => matchesSearch(search, request.fullName, ...(skillsOf.get(request.memberId) ?? []))),
    [requests, search, skillsOf],
  )
  const tabCounts = useMemo(() => countResponses(searched), [searched])
  const visible = searched.filter(
    (request) => filter === 'all' || (filter === 'none' ? !request.response : request.response === filter),
  )

  const handleSend = (memberIds: string[]) =>
    send.mutate(memberIds, {
      onSuccess: () => {
        message.success(`Đã gửi yêu cầu xác nhận cho ${memberIds.length} thành viên.`)
        setPicking(false)
      },
      onError: (error) => message.error(participationErrorMessage(error, 'Không thể gửi yêu cầu. Vui lòng thử lại.')),
    })

  const sendButton = (
    <Button type="primary" icon={<SendOutlined />} onClick={() => setPicking(true)} disabled={!participation.isSuccess}>
      Gửi yêu cầu xác nhận
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Xác nhận tham gia"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Xác nhận tham gia' }]}
        description="Gửi yêu cầu xác nhận tham gia phục vụ và theo dõi phản hồi."
        // The first send is offered here; later ones reach members not asked yet, from the list toolbar.
        extra={program && !isPast && participation.isSuccess && requests.length === 0 && sendButton}
      />
      {programs.isPending && <SectionSkeleton rows={6} label="Đang tải chương trình phụng vụ" />}
      {programs.isError && (
        <ErrorState title="Không thể tải chương trình phụng vụ" onRetry={() => programs.refetch()} retrying={programs.isFetching} />
      )}
      {programs.isSuccess && !program && (
        <EmptyState title="Chưa có chương trình phụng vụ" description="Yêu cầu xác nhận tham gia được gửi theo từng chương trình." />
      )}
      {program && (
        <Flex vertical gap={spacing.md}>
          <Card>
            <Flex wrap gap={spacing.md} align="center" justify="space-between">
              <Select
                showSearch
                optionFilterProp="label"
                aria-label="Chọn chương trình phụng vụ"
                value={program.id}
                onChange={(programId: string) => setSearchParams({ programId })}
                options={allPrograms.map((item) => ({
                  value: item.id,
                  label: `${item.eventName} · ${formatProgramDate(item.date)}${item.date < today ? ' (đã qua)' : ''}`,
                }))}
                style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}
              />
              <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chi tiết chương trình</Link>
            </Flex>
          </Card>
          {isPast && requests.length > 0 && (
            <Alert type="info" showIcon title="Chương trình đã qua: không gửi thêm yêu cầu xác nhận được." />
          )}
          {participation.isPending && <SectionSkeleton rows={8} label="Đang tải phản hồi" />}
          {participation.isError && (
            <ErrorState
              title="Không thể tải phản hồi xác nhận"
              onRetry={() => participation.refetch()}
              retrying={participation.isFetching}
            />
          )}
          {participation.isSuccess && requests.length === 0 && (
            <EmptyState
              title="Chưa gửi yêu cầu xác nhận"
              description={
                isPast
                  ? 'Chương trình đã qua nên không gửi được yêu cầu xác nhận.'
                  : 'Chọn thành viên để gửi yêu cầu xác nhận tham gia phục vụ chương trình này.'
              }
              action={isPast ? undefined : sendButton}
            />
          )}
          {participation.isSuccess && requests.length > 0 && (
            <>
              <MetricSummary definitions={metrics} values={counts} />
              <Card styles={{ body: { padding: 0 } }}>
                <Flex vertical gap={spacing.sm} style={{ padding: spacing.md }}>
                  <Flex wrap gap={spacing.sm} align="center" justify="space-between">
                    <Input
                      allowClear
                      prefix={<SearchOutlined aria-hidden />}
                      placeholder="Tìm theo tên hoặc kỹ năng"
                      aria-label="Tìm thành viên"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={{ flex: '1 1 240px', maxWidth: 380 }}
                    />
                    <Flex wrap gap={spacing.sm} align="center">
                      {/* The list reloads when the window is focused again or on request, so say how old it is. */}
                      <Typography.Text style={{ color: colors.textMuted }}>
                        Cập nhật lúc {dayjs(participation.dataUpdatedAt).format('HH:mm')}
                      </Typography.Text>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => participation.refetch()}
                        loading={participation.isFetching && !send.isPending}
                      >
                        Làm mới
                      </Button>
                      <Button icon={<SendOutlined />} onClick={() => setPicking(true)} disabled={isPast || send.isPending}>
                        Gửi thêm cho thành viên chưa được mời
                      </Button>
                    </Flex>
                  </Flex>
                  <Segmented<ResponseFilter>
                    value={filter}
                    onChange={setFilter}
                    style={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}
                    options={[
                      { value: 'all', label: `Tất cả (${tabCounts.sent})` },
                      { value: 'confirmed', label: `${participationResponseLabels.confirmed} (${tabCounts.confirmed})` },
                      { value: 'unsure', label: `${participationResponseLabels.unsure} (${tabCounts.unsure})` },
                      { value: 'declined', label: `${participationResponseLabels.declined} (${tabCounts.declined})` },
                      { value: 'none', label: `Chưa phản hồi (${tabCounts.none})` },
                    ]}
                  />
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
            </>
          )}
        </Flex>
      )}
      <SendRequestModal
        open={picking}
        excludedMemberIds={requests.map((request) => request.memberId)}
        sending={send.isPending}
        onSend={handleSend}
        onCancel={() => setPicking(false)}
      />
    </>
  )
}
