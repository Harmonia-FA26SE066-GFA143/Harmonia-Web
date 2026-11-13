import { Alert, Typography } from 'antd'
import { useChoirMembers } from '@/features/members'
import { spacing } from '@/styles/tokens'
import { useMembersOfChoirs } from '../hooks/useChoirs'
import type { Choir } from '../types'

const named = 8

/**
 * Admin: the active Choir Members who are in no choir. A new account, created by the Admin or from a join request,
 * starts in none, and only members of a serving choir can be asked to serve or given practice (ChoirScopeService).
 * The member profile carries no choir (tbd-backlog B54), so the list is worked out here from every choir's members.
 * ponytail: `useChoirMembers` reads the first 100 active profiles; a larger parish needs the BE filter of B54.
 */
export function UnplacedMembersNotice({ choirs }: Readonly<{ choirs: Choir[] }>) {
  const profiles = useChoirMembers()
  const placed = useMembersOfChoirs(choirs.map((choir) => choir.id))
  if (!profiles.data || !placed.data) return null

  const inAChoir = new Set(placed.data.map((member) => member.memberId))
  // A profile kept after its account became Choir Director or Parish Priest is not waiting for a choir.
  const unplaced = profiles.data.filter((member) => !inAChoir.has(member.id) && (member.roleName ?? 'ChoirMember') === 'ChoirMember')
  if (unplaced.length === 0) return null

  const names = unplaced.slice(0, named).map((member) => member.fullName).join(', ')
  const more = unplaced.length - named
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: spacing.md }}
      title={`${unplaced.length} ca viên chưa thuộc ca đoàn nào`}
      description={
        <>
          <Typography.Text>
            {names}
            {more > 0 && ` và ${more} người khác`}.
          </Typography.Text>{' '}
          Ca viên chưa có ca đoàn không được mời phục vụ và không nhận bài tập. Bấm “Ca viên” ở một ca đoàn rồi thêm họ vào.
        </>
      }
    />
  )
}
