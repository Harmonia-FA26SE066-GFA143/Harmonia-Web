import { App, Avatar, Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { RejectSkillModal, useRevokeSkill } from '@/features/skill-approval'
import { errorMessage } from '@/lib/api/errors'
import { CLOSE_LABEL, EDIT_MEMBER_ACTION, EmptyCell, hasVoicePart, UnassignedVoiceCell, VIEW_MEMBER_DRAWER_TITLE, ViewDrawer, voicePartName } from '@/shared/ui'
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

/** Refusals of a revoke (MemberSkillService.RevokeAsync). */
const revokeMessages: Record<string, string> = {
  MEMBER_SKILL_NOT_APPROVED: 'Kỹ năng này không còn ở trạng thái đã duyệt. Danh sách đã được tải lại.',
  MEMBER_SKILL_NOT_FOUND: 'Kỹ năng không còn tồn tại hoặc ca viên không thuộc ca đoàn bạn phụ trách.',
  MEMBER_NOT_ACTIVE: 'Ca viên không còn sinh hoạt.',
}

/**
 * Profile of one member (G2-09). An approved skill can be revoked with a reason (B63: the list now carries the
 * `MemberSkill.Id`, PATCH api/member-skills/{id}/revoke).
 */
export function MemberDetailDrawer({ member, onClose, onEdit }: Readonly<MemberDetailDrawerProps>) {
  const editable = member?.role === 'member'
  const { message } = App.useApp()
  const revoke = useRevokeSkill()
  const [revoking, setRevoking] = useState<{ id: string; name: string }>()
  // The drawer shows the row it was opened with; a revoked skill leaves it at once, the list reloads behind it.
  const [revoked, setRevoked] = useState<string[]>([])
  const approved = (member?.approvedSkills ?? []).filter((skill) => !revoked.includes(skill.id))

  const submitRevoke = (reason: string) => {
    if (!revoking || revoke.isPending) return
    revoke.mutate(
      { id: revoking.id, reason },
      {
        onSuccess: () => {
          message.success(`Đã thu hồi kỹ năng ${voicePartName(revoking.name)}. Ca viên sẽ nhận được thông báo.`)
          setRevoked((ids) => [...ids, revoking.id])
          setRevoking(undefined)
        },
        onError: (error) => message.error(errorMessage(error, revokeMessages, 'Không thể thu hồi kỹ năng. Vui lòng thử lại.')),
      },
    )
  }
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
            {member.choirs && (
              <>
                <dt>Ca đoàn</dt>
                <dd>{member.choirs.length ? member.choirs.map((choir) => choir.name).join(', ') : <EmptyCell text="Chưa thuộc ca đoàn nào" />}</dd>
              </>
            )}
          </dl>
          <section aria-labelledby="member-detail-skills">
            <Typography.Title id="member-detail-skills" level={4} style={{ margin: `0 0 ${spacing.sm}px`, fontSize: typography.label.fontSize }}>
              Bè & Kỹ năng đã duyệt
            </Typography.Title>
            {editable && approved.length > 0 ? (
              // One row per skill, its tag beside its revoke action, so each skill is listed once.
              <>
                {!hasVoicePart(approved.map((skill) => skill.name)) && <UnassignedVoiceCell />}
                <ul className="hm-revoke-list" aria-label="Thu hồi kỹ năng đã duyệt">
                  {approved.map((skill) => (
                    <li key={skill.id}>
                      <VoicePartTags skills={[skill.name]} />
                      <Button size="small" type="link" danger onClick={() => setRevoking(skill)} aria-label={`Thu hồi kỹ năng ${voicePartName(skill.name)}`}>
                        Thu hồi
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Flex vertical gap={spacing.xs} align="flex-start">
                <VoicePartTags skills={member.skills.filter((name) => approved.some((skill) => skill.name === name) || !member.approvedSkills)} showUnassigned={editable} />
                {member.skills.length === 0 && <EmptyCell text="Chưa có kỹ năng được duyệt" />}
              </Flex>
            )}
          </section>
        </Flex>
      )}
      <RejectSkillModal
        revoke
        skill={revoking && member && { memberName: member.fullName, skillName: voicePartName(revoking.name) }}
        saving={revoke.isPending}
        onSubmit={submitRevoke}
        onCancel={() => setRevoking(undefined)}
      />
    </ViewDrawer>
  )
}
