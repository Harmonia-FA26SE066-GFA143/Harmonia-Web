import { App, Card, Flex } from 'antd'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { usePendingSkills } from '@/features/skill-approval'
import { errorMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import {
  countVoiceParts,
  EmptyChoir,
  EmptyState,
  ErrorState,
  NoFilterResults,
  PageHeader,
  SectionSkeleton,
  SummaryStrip,
  UNASSIGNED_VOICE_LABEL,
  voiceParts,
  type SummaryCell,
} from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { MemberDetailDrawer } from '../components/MemberDetailDrawer'
import { MemberFilterBar } from '../components/MemberFilterBar'
import { MemberFormDrawer } from '../components/MemberFormDrawer'
import { MemberTable } from '../components/MemberTable'
import { useAllChoirMembers } from '../hooks/useChoirMembers'
import { useMemberProfiles, useUpdateMemberProfile } from '../hooks/useMemberProfiles'
import { emptyMemberFilters, hasActiveMemberFilters } from '../memberFilters'
import { memberStatuses, type MemberFilters, type MemberProfile, type MemberProfileValues, type MemberStatus } from '../types'

const pageSize = 20
const onePage = { pageNumber: 1, pageSize: 1 }
const activeFilter = { search: '', status: 'active' as const }
const onLeaveFilter = { search: '', status: 'inactive' as const }
const leftFilter = { search: '', status: 'left' as const }

/** Filters and page live in the URL (artifact MembersPage), so a filtered list can be shared or reopened. */
function readState(params: URLSearchParams): { filters: MemberFilters; page: number } {
  const status = params.get('status')
  return {
    filters: {
      search: params.get('q') ?? '',
      status: memberStatuses.includes(status as MemberStatus) ? (status as MemberStatus) : undefined,
      skillId: params.get('skill') ?? undefined,
    },
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}

function writeState(filters: MemberFilters, page: number) {
  const params = new URLSearchParams()
  if (filters.search) params.set('q', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.skillId) params.set('skill', filters.skillId)
  if (page > 1) params.set('page', String(page))
  return params
}


/**
 * Choir Director: choir members (FE-24) on `/api/member-profiles`. Members are ChoirMember accounts the Admin
 * created; the Choir Director searches them and edits their phone, dates and status. Skills come from the
 * declarations approved on the Skill Approval page.
 */
/** `PUT /api/member-profiles/{id}` refusals the Choir Director can act on. */
const updateMessages: Record<string, string> = {
  MEMBER_NOT_FOUND: 'Ca viên không còn tồn tại. Vui lòng tải lại trang.',
  // BE 9b1f587: the account became a Choir Director or Parish Priest meanwhile; the profile is history only.
  MEMBER_NOT_ACTIVE: 'Tài khoản này không còn là ca viên nên không sửa được hồ sơ. Vui lòng tải lại trang.',
}

export function MembersPage() {
  const { message } = App.useApp()
  const [params, setParams] = useSearchParams()
  const { filters, page } = useMemo(() => readState(params), [params])
  const setPage = (next: number) => setParams(writeState(filters, next), { replace: true })
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const members = useMemberProfiles(query, { pageNumber: page, pageSize })
  const update = useUpdateMemberProfile()
  // Counts above the list: totals from one-row pages, voice parts from every active member (all pages, G2-03).
  // Undefined while loading or failed, so a cell reads "Chưa có dữ liệu", never a false 0 (R2.6).
  const allActive = useAllChoirMembers()
  const activeTotal = useMemberProfiles(activeFilter, onePage).data?.totalCount
  const onLeave = useMemberProfiles(onLeaveFilter, onePage).data?.totalCount
  const left = useMemberProfiles(leftFilter, onePage).data?.totalCount
  const pendingSkills = usePendingSkills(onePage).data?.totalCount
  const voices = allActive.isSuccess ? countVoiceParts(allActive.data, (member) => member.skills) : undefined
  const statusCells: SummaryCell[] = [
    { label: 'Đang sinh hoạt', value: activeTotal },
    { label: 'Tạm nghỉ', value: onLeave },
    { label: 'Đã nghỉ', value: left },
    { label: 'Chờ duyệt kỹ năng', value: pendingSkills, waiting: <Link to={paths.director.skillApproval}>Duyệt kỹ năng</Link> },
  ]
  const voiceCells: SummaryCell[] = [
    ...voiceParts.map(({ label }) => ({ label, value: voices?.[label] })),
    { label: UNASSIGNED_VOICE_LABEL, value: voices?.unassigned },
  ]
  const description = activeTotal === undefined ? 'Tài khoản ca viên do Quản trị viên tạo.' : `${activeTotal} ca viên đang sinh hoạt`
  const [viewing, setViewing] = useState<MemberProfile>()
  const [editing, setEditing] = useState<MemberProfile>()

  const total = members.data?.totalCount ?? 0
  const filtered = hasActiveMemberFilters(query)
  const changeFilters = (next: MemberFilters) => setParams(writeState(next, 1), { replace: true })
  const resetFilters = () => changeFilters(emptyMemberFilters)

  const handleSubmit = (values: MemberProfileValues) => {
    if (!editing || update.isPending) return
    update.mutate(
      { id: editing.id, values },
      {
        onSuccess: () => {
          message.success('Đã lưu thông tin ca viên.')
          setEditing(undefined)
        },
        // The drawer stays open so the entered values are not lost.
        onError: (error) =>
          message.error(
            errorMessage(error, updateMessages, 'Không thể lưu thông tin ca viên. Vui lòng thử lại.'),
          ),
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Danh sách ca viên"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Danh sách ca viên' }]}
        description={description}
      />
      <Flex vertical gap={spacing.md} style={{ marginBottom: spacing.lg }}>
        <SummaryStrip label="Tình trạng ca viên" cells={statusCells} />
        <SummaryStrip label="Phân bố theo bè (ca viên đang sinh hoạt)" cells={voiceCells} />
      </Flex>

      {members.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách ca viên" />}
      {members.isError && (
        <ErrorState title="Không thể tải danh sách ca viên" error={members.error} hasData={members.data !== undefined} onRetry={() => members.refetch()} retrying={members.isFetching} />
      )}
      {members.data !== undefined && total === 0 && !filtered && (
        <EmptyState
          icon={<EmptyChoir />} title="Chưa có ca viên nào"
          description="Ca viên xuất hiện tại đây sau khi Quản trị viên tạo tài khoản với vai trò Ca viên."
        />
      )}
      {members.data !== undefined && (total > 0 || filtered) && (
        <>
        <MemberFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={members.data?.totalCount} error={members.isError} />
        <Card styles={{ body: { padding: 0 } }}>
          {total === 0 ? (
            <div style={{ padding: spacing.lg }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <MemberTable
              members={members.data.items}
              page={page}
              pageSize={pageSize}
              total={total}
              loading={members.isPlaceholderData}
              onPageChange={setPage}
              onView={setViewing}
              onEdit={setEditing}
            />
          )}
        </Card>
        </>
      )}

      <MemberDetailDrawer
        member={viewing}
        onClose={() => setViewing(undefined)}
        onEdit={(member) => {
          setViewing(undefined)
          setEditing(member)
        }}
      />
      <MemberFormDrawer
        member={editing}
        saving={update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(undefined)}
      />
    </>
  )
}
