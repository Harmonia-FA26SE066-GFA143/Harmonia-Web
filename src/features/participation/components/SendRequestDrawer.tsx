import { Checkbox, Flex, Typography } from 'antd'
import { useState } from 'react'
import { useChoirs, useEventChoirs, useMembersOfChoirs } from '@/features/choirs'
import { SkillTags, useChoirMembers } from '@/features/members'
import { EmptyState, ErrorState, FormDrawer, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing } from '@/styles/tokens'

export interface SendRequestDrawerProps {
  open: boolean
  programId: string
  /** Members already asked for this program; the backend asks each member once. */
  excludedMemberIds: string[]
  sending?: boolean
  /** No ids: everyone of the serving choirs who has not been asked yet (the backend picks them). */
  onSend: (memberIds?: string[]) => void
  onCancel: () => void
}

/**
 * Choose who is asked to serve (FE-33). Only members of the choirs serving the program can be asked: the backend
 * refuses the whole request otherwise (MEMBER_NOT_FOUND, EventParticipationService.ResolveInviteesAsync). The Choir
 * Director reads the members of their own choirs only (ChoirService.GetMembersAsync), so those are picked by name;
 * the members of another serving choir can only be asked all together, by sending no ids.
 * TBD: Backend API missing (tbd-backlog B53): the members who can be asked for an event, other choirs included.
 */
export function SendRequestDrawer({ open, programId, excludedMemberIds, sending = false, onSend, onCancel }: Readonly<SendRequestDrawerProps>) {
  const eventChoirs = useEventChoirs(programId)
  const myChoirs = useChoirs()
  const myChoirIds = new Set((myChoirs.data ?? []).map((choir) => choir.id))
  const serving = eventChoirs.data ?? []
  const otherChoirs = serving.filter((choir) => !myChoirIds.has(choir.choirId))
  const members = useMembersOfChoirs(serving.filter((choir) => myChoirIds.has(choir.choirId)).map((choir) => choir.choirId))
  // Skills are shown beside the name only; the list does not wait for them.
  const profiles = useChoirMembers()
  const skillsOf = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.skills]))

  // Track deselected members so everyone is selected by default, including members loaded later.
  const [deselected, setDeselected] = useState<string[]>([])
  const [everyoneChoice, setEveryoneChoice] = useState<boolean>()
  // The lead choir's director asks for the whole program, so the other serving choirs are included unless unticked.
  const everyone = otherChoirs.length > 0 && (everyoneChoice ?? true)

  const failed = [eventChoirs, myChoirs, members].find((query) => query.isError)
  const loaded = eventChoirs.data !== undefined && myChoirs.data !== undefined && members.data !== undefined
  const available = (members.data ?? [])
    .filter((member) => !excludedMemberIds.includes(member.memberId))
    .map((member) => ({ id: member.memberId, fullName: member.fullName, skills: skillsOf.get(member.memberId) ?? [] }))
  const selected = available.filter((member) => !deselected.includes(member.id)).map((member) => member.id)
  const otherNames = otherChoirs.map((choir) => choir.name).join(', ')

  const toggleAll = (checked: boolean) => setDeselected(checked ? [] : available.map((member) => member.id))
  const okText = everyone ? 'Gửi cho mọi ca viên chưa được mời' : selected.length ? `Gửi cho ${selected.length} thành viên` : 'Gửi yêu cầu'

  return (
    <FormDrawer
      open={open}
      title="Gửi yêu cầu xác nhận tham gia"
      okText={okText}
      cancelText="Hủy"
      okButtonProps={{ disabled: !loaded || (!everyone && selected.length === 0), loading: sending }}
      cancelButtonProps={{ disabled: sending }}
      onOk={() => onSend(everyone ? undefined : selected)}
      onCancel={onCancel}
      afterClose={() => {
        setDeselected([])
        setEveryoneChoice(undefined)
      }}
      size={600}
      destroyOnHidden
    >
      {!failed && !loaded && <SectionSkeleton rows={5} label="Đang tải thành viên" />}
      {failed && (
        <ErrorState
          title="Không thể tải thành viên"
          onRetry={() => [eventChoirs, myChoirs, members].forEach((query) => query.isError && query.refetch())}
          retrying={eventChoirs.isFetching || myChoirs.isFetching || members.isFetching}
        />
      )}
      {!failed && loaded && (
        <Flex vertical gap={spacing.md}>
          {otherChoirs.length > 0 && (
            <Checkbox checked={everyone} onChange={(event) => setEveryoneChoice(event.target.checked)}>
              Mời mọi ca viên của các ca đoàn phục vụ chương trình
              <Typography.Text style={{ display: 'block', color: colors.textMuted }}>
                Gồm cả {otherNames}. Bạn không xem được danh sách ca viên của ca đoàn do ca trưởng khác phụ trách, nên chỉ mời
                được cả ca đoàn đó cùng lúc.
              </Typography.Text>
            </Checkbox>
          )}
          {available.length === 0 && !everyone && (
            <EmptyState
              title={otherChoirs.length > 0 ? 'Không còn ca viên nào của ca đoàn bạn để mời' : 'Mọi thành viên đã được gửi yêu cầu'}
            />
          )}
          {available.length > 0 && !everyone && (
            <Flex vertical gap={spacing.sm}>
              <Checkbox
                checked={selected.length === available.length}
                indeterminate={selected.length > 0 && selected.length < available.length}
                onChange={(event) => toggleAll(event.target.checked)}
              >
                Chọn tất cả ({selected.length}/{available.length})
              </Checkbox>
              <Checkbox.Group
                value={selected}
                onChange={(values) => setDeselected(available.map((member) => member.id).filter((id) => !values.includes(id)))}
                style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, maxHeight: 360, overflowY: 'auto' }}
              >
                {available.map((member) => (
                  <Checkbox
                    key={member.id}
                    value={member.id}
                    style={{ padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.md, marginInlineStart: 0 }}
                  >
                    <Flex wrap gap={spacing.sm} align="center">
                      <Typography.Text>{member.fullName}</Typography.Text>
                      <SkillTags skills={member.skills} />
                    </Flex>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Flex>
          )}
        </Flex>
      )}
    </FormDrawer>
  )
}
