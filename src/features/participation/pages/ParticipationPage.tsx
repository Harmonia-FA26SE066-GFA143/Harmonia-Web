import { ReloadOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Input, Segmented, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, Link, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, upcomingPrograms, usePrograms } from '@/features/liturgical-programs'
import { SkillTags } from '@/features/members'
import { EmptyState, ErrorState, MetricSummary, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, spacing, typography } from '@/styles/tokens'
import { SendRequestModal } from '../components/SendRequestModal'
import { useParticipation, useSendParticipationRequests } from '../hooks/useParticipation'
import { participationResponseLabels, type ParticipationRequest, type ParticipationResponse } from '../types'

type ResponseFilter = 'all' | ParticipationResponse | 'none'

const responseColors: Record<ParticipationResponse, string> = { confirmed: 'green', unsure: 'gold', declined: 'red' }

const metrics = [
  { key: 'sent', label: 'Đã gửi yêu cầu' },
  { key: 'confirmed', label: participationResponseLabels.confirmed },
  { key: 'unsure', label: participationResponseLabels.unsure },
  { key: 'declined', label: participationResponseLabels.declined },
  { key: 'none', label: 'Chưa phản hồi' },
]

const formatDateTime = (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')

const columns: TableColumnsType<ParticipationRequest> = [
  { key: 'name', title: 'Thành viên', render: (_, request) => <Typography.Text strong>{request.fullName}</Typography.Text> },
  { key: 'skills', title: 'Kỹ năng', render: (_, request) => <SkillTags skills={request.skills} /> },
  {
    key: 'sentAt',
    title: 'Gửi yêu cầu lúc',
    render: (_, request) => (
      <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>{formatDateTime(request.sentAt)}</Typography.Text>
    ),
  },
  {
    key: 'response',
    title: 'Phản hồi',
    render: (_, request) =>
      request.response ? (
        <Flex vertical gap={2} align="flex-start">
          <Tag color={responseColors[request.response]} style={{ marginInlineEnd: 0 }}>
            {participationResponseLabels[request.response]}
          </Tag>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
            {formatDateTime(request.respondedAt)}
          </Typography.Text>
        </Flex>
      ) : (
        <Tag style={{ marginInlineEnd: 0 }}>Chưa phản hồi</Tag>
      ),
  },
]

/**
 * Choir Director: send participation confirmation requests for a liturgical program and follow the responses
 * (FE-06, FE-33–FE-34). One round per program, recipients chosen by the Director (decision 2026-09-29).
 * `?programId=` selects the program (link from the program detail); otherwise the next upcoming program.
 * TBD: "real time" latency (FE-34) – the list refreshes on focus and with the refresh button.
 */
export function ParticipationPage() {
  const { message, modal } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const programs = usePrograms()
  const allPrograms = useMemo(() => programs.data ?? [], [programs.data])
  const program =
    allPrograms.find((item) => item.id === searchParams.get('programId')) ?? upcomingPrograms(allPrograms)[0] ?? allPrograms[0]
  const participation = useParticipation(program?.id)
  const send = useSendParticipationRequests(program?.id ?? '')
  const [picking, setPicking] = useState(false)
  const [filter, setFilter] = useState<ResponseFilter>('all')
  const [search, setSearch] = useState('')

  const requests = useMemo(() => participation.data ?? [], [participation.data])
  const counts = useMemo(() => {
    const count = (response?: ParticipationResponse) => requests.filter((request) => request.response === response).length
    return { sent: requests.length, confirmed: count('confirmed'), unsure: count('unsure'), declined: count('declined'), none: count() }
  }, [requests])
  const pending = requests.filter((request) => !request.response)
  const visible = requests.filter(
    (request) =>
      (filter === 'all' || (filter === 'none' ? !request.response : request.response === filter)) &&
      matchesSearch(search, request.fullName, ...request.skills),
  )

  const handleSend = (memberIds: string[]) =>
    send.mutate(memberIds, {
      onSuccess: () => {
        message.success(`Đã gửi yêu cầu xác nhận cho ${memberIds.length} thành viên.`)
        setPicking(false)
      },
      onError: () => message.error('Không thể gửi yêu cầu. Vui lòng thử lại.'),
    })

  const handleResend = () =>
    modal.confirm({
      title: 'Gửi lại yêu cầu xác nhận?',
      content: `Yêu cầu sẽ được gửi lại cho ${pending.length} thành viên chưa phản hồi.`,
      okText: 'Gửi lại',
      cancelText: 'Hủy',
      onOk: () =>
        send
          .mutateAsync(pending.map((request) => request.memberId))
          .then(() => message.success(`Đã gửi lại yêu cầu cho ${pending.length} thành viên.`))
          .catch(() => message.error('Không thể gửi lại yêu cầu. Vui lòng thử lại.')),
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
        // One round per program (decision 2026-09-29): after it is sent, only resending to non-responders.
        extra={program && participation.isSuccess && requests.length === 0 && sendButton}
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
                options={allPrograms.map((item) => ({ value: item.id, label: `${item.eventName} · ${formatProgramDate(item.date)}` }))}
                style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}
              />
              <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chi tiết chương trình</Link>
            </Flex>
          </Card>
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
              description="Chọn thành viên để gửi yêu cầu xác nhận tham gia phục vụ chương trình này."
              action={sendButton}
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
                    <Flex wrap gap={spacing.sm}>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => participation.refetch()}
                        loading={participation.isFetching && !send.isPending}
                      >
                        Làm mới
                      </Button>
                      <Button icon={<SendOutlined />} onClick={handleResend} disabled={pending.length === 0 || send.isPending}>
                        Gửi lại cho {pending.length} thành viên chưa phản hồi
                      </Button>
                    </Flex>
                  </Flex>
                  <Segmented<ResponseFilter>
                    value={filter}
                    onChange={setFilter}
                    style={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}
                    options={[
                      { value: 'all', label: `Tất cả (${counts.sent})` },
                      { value: 'confirmed', label: `${participationResponseLabels.confirmed} (${counts.confirmed})` },
                      { value: 'unsure', label: `${participationResponseLabels.unsure} (${counts.unsure})` },
                      { value: 'declined', label: `${participationResponseLabels.declined} (${counts.declined})` },
                      { value: 'none', label: `Chưa phản hồi (${counts.none})` },
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
        sending={send.isPending}
        onSend={handleSend}
        onCancel={() => setPicking(false)}
      />
    </>
  )
}
