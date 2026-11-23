import { Avatar, Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { CLOSE_LABEL, EDIT_MEMBER_ACTION, EmptyCell, VIEW_MEMBER_DRAWER_TITLE, ViewDrawer } from '@/shared/ui'
import { genderLabel, personName } from '@/shared/utils/personName'
import { colors, component, spacing, typography } from '@/styles/tokens'
import type { MemberProfile } from '../types'
import { initials } from '../utils/initials'
import { MemberStatusTag } from './MemberTable'
import { VoicePartTags } from './SkillTags'

export interface MemberDetailDrawerProps {
  /** The member shown; the drawer is closed without one. */
  member?: MemberProfile
  onClose: () => void
  onEdit: (member: MemberProfile) => void
}

const day = (value?: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : <EmptyCell />)

/**
 * Read-only profile of one member (G2-09). Skills are listed without a revoke action: the list endpoint returns no
 * `MemberSkill.Id` to revoke with (B63).
 */
export function MemberDetailDrawer({ member, onClose, onEdit }: Readonly<MemberDetailDrawerProps>) {
  const editable = member?.role === 'member'
  return (
    <ViewDrawer
      open={Boolean(member)}
      title={VIEW_MEMBER_DRAWER_TITLE}
      size={component.drawer.md}
      onClose={onClose}
      destroyOnHidden
      footer={
        editable ? (
          <Flex justify="flex-end" gap={spacing.sm}>
            <Button onClick={onClose}>{CLOSE_LABEL}</Button>
            <Button type="primary" onClick={() => member && onEdit(member)}>
              {EDIT_MEMBER_ACTION}
            </Button>
          </Flex>
        ) : undefined
      }
    >
      {member && (
        <Flex vertical gap={spacing.lg}>
          <Flex align="center" gap={spacing.md}>
            <Avatar aria-hidden size={56} src={member.avatarUrl} style={{ flexShrink: 0, background: colors.softSurface, color: colors.textBody, fontWeight: 600 }}>
              {initials(member.fullName)}
            </Avatar>
            <Flex vertical gap={4} align="flex-start">
              <Typography.Title level={3} style={{ margin: 0, fontSize: typography.cardHeading.fontSize }}>
                {personName(member.fullName, member.saintName)}
              </Typography.Title>
              <MemberStatusTag member={member} />
            </Flex>
          </Flex>
          <dl className="hm-facts" aria-label="Thông tin ca viên">
            <dt>Email</dt>
            <dd>{member.email}</dd>
            <dt>Số điện thoại</dt>
            <dd>{member.phone || <EmptyCell />}</dd>
            <dt>Tên thánh</dt>
            <dd>{member.saintName || <EmptyCell />}</dd>
            <dt>Giới tính</dt>
            <dd>{genderLabel(member.gender) ?? <EmptyCell />}</dd>
            <dt>Ngày sinh</dt>
            <dd>{day(member.dateOfBirth)}</dd>
            <dt>Ngày tham gia</dt>
            <dd>{day(member.joinedDate)}</dd>
          </dl>
          <section aria-labelledby="member-detail-skills">
            <Typography.Title id="member-detail-skills" level={4} style={{ margin: `0 0 ${spacing.sm}px`, fontSize: typography.label.fontSize }}>
              Bè & Kỹ năng đã duyệt
            </Typography.Title>
            <Flex vertical gap={spacing.xs} align="flex-start">
              <VoicePartTags skills={member.skills} showUnassigned={editable} />
              {member.skills.length === 0 && <EmptyCell text="Chưa có kỹ năng được duyệt" />}
            </Flex>
          </section>
        </Flex>
      )}
    </ViewDrawer>
  )
}
