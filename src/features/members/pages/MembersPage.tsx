import { App, Card } from 'antd'
import { useMemo, useState } from 'react'
import { errorMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyChoir, EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton, SummaryStrip } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { MemberFilterBar } from '../components/MemberFilterBar'
import { MemberFormDrawer } from '../components/MemberFormDrawer'
import { MemberTable } from '../components/MemberTable'
import { useChoirMembers } from '../hooks/useChoirMembers'
import { useMemberProfiles, useUpdateMemberProfile } from '../hooks/useMemberProfiles'
import { emptyMemberFilters, hasActiveMemberFilters } from '../memberFilters'
import type { MemberFilters, MemberProfile, MemberProfileValues } from '../types'

const pageSize = 20

/** The four voice parts, matched on the approved skill names as VoicePartIcon reads them. */
const voiceParts = [
  { label: 'Soprano', pattern: /soprano|nữ cao/i },
  { label: 'Alto', pattern: /alto|nữ trầm/i },
  { label: 'Tenor', pattern: /tenor|nam cao/i },
  { label: 'Bass', pattern: /bass|nam trầm/i },
]

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
  const [filters, setFilters] = useState<MemberFilters>(emptyMemberFilters)
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const members = useMemberProfiles(query, { pageNumber: page, pageSize })
  const update = useUpdateMemberProfile()
  // Active members with their approved skills, for the counts above the list (the same request other pages share).
  const active = useChoirMembers()
  const activeCells = active.data && [
    { label: 'Đang sinh hoạt', value: active.data.length },
    ...voiceParts.map(({ label, pattern }) => ({ label, value: active.data.filter((member) => member.skills.some((skill) => pattern.test(skill))).length })),
  ]
  const [editing, setEditing] = useState<MemberProfile>()

  const total = members.data?.totalCount ?? 0
  const filtered = hasActiveMemberFilters(query)
  const changeFilters = (next: MemberFilters) => {
    setFilters(next)
    setPage(1)
  }
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
        description="Tài khoản ca viên do Quản trị viên tạo."
      />
      {activeCells && (
        <div style={{ marginBottom: spacing.md }}>
          <SummaryStrip label="Ca viên đang sinh hoạt theo bè" cells={activeCells} />
        </div>
      )}

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

      <MemberFormDrawer
        member={editing}
        saving={update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(undefined)}
      />
    </>
  )
}
