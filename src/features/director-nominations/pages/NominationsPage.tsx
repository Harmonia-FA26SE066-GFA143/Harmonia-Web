import { PlusOutlined } from '@ant-design/icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Select, Table, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { getSession } from '@/lib/auth/session'
import { EmptyChoir, EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { listNominations } from '../api/nominationsApi'
import { NominationDetailDrawer } from '../components/NominationDetailDrawer'
import { NominationFormDrawer } from '../components/NominationFormDrawer'
import { statusColors, statusLabels, type Nomination, type NominationStatus } from '../types'

const pageSize = 20

const intro = {
  ChoirDirector: 'Các đề cử do bạn tạo. Cha xứ duyệt và quản lý đào tạo, Admin bổ nhiệm.',
  ParishPriest: 'Duyệt đề cử, cử đi học hoặc miễn đào tạo.',
  Admin: 'Bổ nhiệm các đề cử đã đào tạo xong hoặc được miễn.',
} as const

/**
 * The director nominations of one role's workspace: what the list holds and which actions show come from the role.
 * The Parish Priest cannot start one here yet: no endpoint gives them the list of members (tbd-backlog B50).
 */
export function NominationsPage({ area }: Readonly<{ area: string }>) {
  const role = getSession()?.user.roleName
  const [status, setStatus] = useState<NominationStatus>()
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string>()
  const [creating, setCreating] = useState(false)
  const nominations = useQuery({
    queryKey: ['director-nominations', 'list', status, page],
    queryFn: () => listNominations(status, page, pageSize),
    placeholderData: keepPreviousData,
  })
  const total = nominations.data?.totalCount ?? 0
  const createButton = role === 'ChoirDirector' && (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>Đề cử Ca trưởng</Button>
  )

  const columns: TableColumnsType<Nomination> = [
    { key: 'member', title: 'Ca viên', render: (_, item) => <Typography.Text strong>{item.memberFullName}</Typography.Text> },
    { key: 'by', title: 'Người đề cử', render: (_, item) => item.nominatedByFullName },
    { key: 'choir', title: 'Ca đoàn đề xuất', render: (_, item) => item.proposedChoirName ?? 'Chưa đề xuất' },
    { key: 'status', title: 'Trạng thái', render: (_, item) => <StatusTag color={statusColors[item.status]} mark={item.status === 'Cancelled' ? 'struck' : undefined}>{statusLabels[item.status]}</StatusTag> },
    { key: 'at', title: 'Ngày đề cử', render: (_, item) => dayjs(parseUtc(item.createdAt)).format('DD/MM/YYYY') },
    { key: 'open', title: 'Thao tác', align: 'right', render: (_, item) => <Button onClick={() => setOpenId(item.id)} aria-label={`Xem đề cử ${item.memberFullName}`}>Xem</Button> },
  ]

  return (
    <>
      <PageHeader
        title="Đề cử Ca trưởng"
        description={role && role !== 'ChoirMember' ? intro[role] : undefined}
        breadcrumb={[{ title: area }, { title: 'Đề cử Ca trưởng' }]}
        extra={createButton || undefined}
      />
      {role === 'ParishPriest' && (
        <Alert type="info" showIcon title="Cha xứ chưa tạo được đề cử trên web vì máy chủ chưa cấp danh sách ca viên cho vai trò này." style={{ marginBottom: spacing.md }} />
      )}
      {nominations.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách đề cử" />}
      {nominations.isError && <ErrorState title="Không thể tải danh sách đề cử" error={nominations.error} hasData={nominations.data !== undefined} onRetry={() => nominations.refetch()} retrying={nominations.isFetching} />}
      {nominations.data !== undefined && total === 0 && !status && (
        <EmptyState icon={<EmptyChoir />} title="Chưa có đề cử nào" description="Đề cử Ca trưởng sẽ xuất hiện tại đây." action={createButton || undefined} />
      )}
      {nominations.data !== undefined && (total > 0 || status) && (
        <Card styles={{ body: { padding: 0 } }}>
          <div style={{ padding: spacing.md, maxWidth: 280 }}>
            <label htmlFor="nomination-status" style={{ display: 'block', marginBottom: 4, fontSize: typography.metadata.fontSize, color: colors.textMuted }}>Trạng thái</label>
            <Select
              id="nomination-status"
              allowClear
              placeholder="Tất cả trạng thái"
              style={{ width: '100%' }}
              value={status}
              onChange={(value?: NominationStatus) => {
                setStatus(value)
                setPage(1)
              }}
              options={(Object.keys(statusLabels) as NominationStatus[]).map((value) => ({ value, label: statusLabels[value] }))}
            />
          </div>
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}><NoFilterResults onClearFilters={() => setStatus(undefined)} /></div>
          ) : (
            <Table<Nomination>
              rowKey="id"
              columns={columns}
              dataSource={nominations.data.items}
              loading={nominations.isPlaceholderData}
              pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
            />
          )}
        </Card>
      )}
      <NominationDetailDrawer id={openId} onClose={() => setOpenId(undefined)} />
      {role === 'ChoirDirector' && <NominationFormDrawer open={creating} onClose={() => setCreating(false)} />}
    </>
  )
}

export const AdminNominationsPage = () => <NominationsPage area="Quản trị hệ thống" />
export const PriestNominationsPage = () => <NominationsPage area="Cha xứ" />
export const DirectorNominationsPage = () => <NominationsPage area="Ca trưởng" />
