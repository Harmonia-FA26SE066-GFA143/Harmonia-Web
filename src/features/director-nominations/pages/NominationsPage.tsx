import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button, Card, Flex, Select, Table, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { getSession } from '@/lib/auth/session'
import {
  ACTIONS_COLUMN_TITLE,
  EmptyCell,
  EmptyChoir,
  EmptyState,
  ErrorState,
  FilterBar,
  filterAllPlaceholder,
  Icon,
  NoFilterResults,
  PageHeader,
  SectionSkeleton,
  SELECT_POPUP_PROPS,
  StatusTag,
} from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { listNominations } from '../api/nominationsApi'
import { NominationDetailDrawer } from '../components/NominationDetailDrawer'
import { NominationFormDrawer } from '../components/NominationFormDrawer'
import { statusColors, statusLabels, type Nomination, type NominationStatus } from '../types'

const pageSize = 20

const intro = {
  ChoirDirector: 'Các đề cử do bạn tạo. Cha xứ duyệt và quản lý đào tạo, Admin bổ nhiệm.',
  ParishPriest: 'Đề cử ca viên, duyệt đề cử, cử đi học hoặc miễn đào tạo.',
  Admin: 'Bổ nhiệm các đề cử đã đào tạo xong hoặc được miễn.',
} as const

/**
 * The director nominations of one role's workspace: what the list holds and which actions show come from the role.
 * The Choir Director and the Parish Priest start one here (the Priest searches the whole parish since BE e18e49b).
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
  const changeStatus = (value?: NominationStatus) => {
    setStatus(value)
    setPage(1)
  }
  const canNominate = role === 'ChoirDirector' || role === 'ParishPriest'
  const createButton = canNominate && (
    <Button type="primary" icon={<Icon name="add" />} onClick={() => setCreating(true)}>Đề cử Ca trưởng</Button>
  )

  const columns: TableColumnsType<Nomination> = [
    { key: 'member', title: 'Ca viên', render: (_, item) => <Typography.Text strong>{item.memberFullName}</Typography.Text> },
    { key: 'by', title: 'Người đề cử', render: (_, item) => item.nominatedByFullName },
    { key: 'choir', title: 'Ca đoàn đề xuất', render: (_, item) => item.proposedChoirName ?? <EmptyCell text="Chưa đề xuất" /> },
    { key: 'status', title: 'Trạng thái', render: (_, item) => <StatusTag color={statusColors[item.status]} mark={item.status === 'Cancelled' ? 'struck' : undefined}>{statusLabels[item.status]}</StatusTag> },
    { key: 'at', title: 'Ngày đề cử', render: (_, item) => dayjs(parseUtc(item.createdAt)).format('DD/MM/YYYY') },
    { key: 'open', title: ACTIONS_COLUMN_TITLE, align: 'center', width: 112, render: (_, item) => <Button type="link" onClick={() => setOpenId(item.id)} aria-label={`Xem đề cử ${item.memberFullName}`}>Xem</Button> },
  ]

  return (
    <>
      <PageHeader
        title="Đề cử Ca trưởng"
        description={role && role !== 'ChoirMember' ? intro[role] : undefined}
        breadcrumb={[{ title: area }, { title: 'Đề cử Ca trưởng' }]}
        extra={createButton || undefined}
      />
      {nominations.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách đề cử" />}
      {nominations.isError && <ErrorState title="Không thể tải danh sách đề cử" error={nominations.error} hasData={nominations.data !== undefined} onRetry={() => nominations.refetch()} retrying={nominations.isFetching} />}
      {nominations.data !== undefined && total === 0 && !status && (
        <EmptyState icon={<EmptyChoir />} title="Chưa có đề cử nào" description="Đề cử Ca trưởng sẽ xuất hiện tại đây." action={createButton || undefined} />
      )}
      {nominations.data !== undefined && (total > 0 || status) && (
        // The status filter with the result count, then the table (artifact NominationsPage).
        <Flex vertical gap={spacing.lg}>
          <FilterBar resultCount={nominations.data?.totalCount} error={nominations.isError} resultNoun="đề cử" hasActiveFilters={Boolean(status)} onReset={() => changeStatus()}>
            <Flex align="center" gap={spacing.sm}>
              <label htmlFor="nomination-status" style={{ fontSize: typography.label.fontSize, color: colors.textMuted, whiteSpace: 'nowrap' }}>Trạng thái</label>
              <Select
                {...SELECT_POPUP_PROPS}
                id="nomination-status"
                allowClear
                placeholder={filterAllPlaceholder('trạng thái')}
                style={{ minWidth: 220, width: 240, maxWidth: '100%' }}
                value={status}
                onChange={changeStatus}
                options={(Object.keys(statusLabels) as NominationStatus[]).map((value) => ({ value, label: statusLabels[value] }))}
              />
            </Flex>
          </FilterBar>
          <Card styles={{ body: { padding: 0 } }}>
          {total === 0 ? (
            <div style={{ padding: spacing.lg }}><NoFilterResults onClearFilters={() => changeStatus()} /></div>
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
        </Flex>
      )}
      <NominationDetailDrawer id={openId} onClose={() => setOpenId(undefined)} />
      {canNominate && <NominationFormDrawer open={creating} onClose={() => setCreating(false)} />}
    </>
  )
}

export const AdminNominationsPage = () => <NominationsPage area="Quản trị hệ thống" />
export const PriestNominationsPage = () => <NominationsPage area="Cha xứ" />
export const DirectorNominationsPage = () => <NominationsPage area="Ca trưởng" />
