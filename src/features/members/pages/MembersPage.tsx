import { App, Card } from 'antd'
import { useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { MemberFilterBar } from '../components/MemberFilterBar'
import { MemberFormModal } from '../components/MemberFormModal'
import { MemberTable } from '../components/MemberTable'
import { useMemberProfiles, useUpdateMemberProfile } from '../hooks/useMemberProfiles'
import { emptyMemberFilters, hasActiveMemberFilters } from '../memberFilters'
import type { MemberFilters, MemberProfile, MemberProfileValues } from '../types'

const pageSize = 20

/**
 * Choir Director: choir members (FE-24) on `/api/member-profiles`. Members are ChoirMember accounts the Admin
 * created; the Choir Director searches them and edits their phone, dates and status. Skills come from the
 * declarations approved on the Skill Approval page.
 */
export function MembersPage() {
  const { message } = App.useApp()
  const [filters, setFilters] = useState<MemberFilters>(emptyMemberFilters)
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const members = useMemberProfiles(query, { pageNumber: page, pageSize })
  const update = useUpdateMemberProfile()
  const [editing, setEditing] = useState<MemberProfile>()

  const total = members.data?.totalCount ?? 0
  const filtered = hasActiveMemberFilters(query)
  const changeFilters = (next: MemberFilters) => {
    setFilters(next)
    setPage(1)
  }
  const resetFilters = () => changeFilters(emptyMemberFilters)

  const handleSubmit = (values: MemberProfileValues) => {
    if (!editing) return
    update.mutate(
      { id: editing.id, values },
      {
        onSuccess: () => {
          message.success('Đã lưu thông tin ca viên.')
          setEditing(undefined)
        },
        // The modal stays open so the entered values are not lost.
        onError: (error) =>
          message.error(
            error instanceof ApiError && error.code === 'MEMBER_NOT_FOUND'
              ? 'Ca viên không còn tồn tại. Vui lòng tải lại trang.'
              : 'Không thể lưu thông tin ca viên. Vui lòng thử lại.',
          ),
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Danh sách ca viên"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Danh sách ca viên' }]}
        description="Tìm và cập nhật thông tin sinh hoạt của ca viên. Tài khoản ca viên do Quản trị viên tạo."
      />

      {members.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách ca viên" />}
      {members.isError && (
        <ErrorState title="Không thể tải danh sách ca viên" onRetry={() => members.refetch()} retrying={members.isFetching} />
      )}
      {members.isSuccess && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có ca viên nào"
          description="Ca viên xuất hiện tại đây sau khi Quản trị viên tạo tài khoản với vai trò Ca viên."
        />
      )}
      {members.isSuccess && (total > 0 || filtered) && (
        <Card styles={{ body: { padding: 0 } }}>
          <MemberFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={total} />
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
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
              onEdit={setEditing}
            />
          )}
        </Card>
      )}

      <MemberFormModal
        member={editing}
        saving={update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(undefined)}
      />
    </>
  )
}
