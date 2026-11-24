import { Flex, Tag, Typography } from 'antd'
import { hasVoicePart, UnassignedVoiceCell, VoicePartIcon } from '@/shared/ui'
import { colors } from '@/styles/tokens'

/** A member's approved skills as neutral tags; "—" when none are recorded. */
export function SkillTags({ skills }: Readonly<{ skills: string[] }>) {
  if (skills.length === 0) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
  return (
    <Flex wrap gap={4}>
      {skills.map((skill) => (
        <Tag key={skill} style={{ marginInlineEnd: 0 }}>
          {skill}
        </Tag>
      ))}
    </Flex>
  )
}

/**
 * Approved skills with the voice-part ones marked by their icon (the backend has no voice-part field, B54).
 * `voiceOnly` keeps the voice parts alone; `showUnassigned` says "Chưa phân bè" when no skill names a voice part.
 */
export function VoicePartTags({
  skills,
  voiceOnly = false,
  showUnassigned = false,
}: Readonly<{ skills: string[]; voiceOnly?: boolean; showUnassigned?: boolean }>) {
  const shown = voiceOnly ? skills.filter((skill) => hasVoicePart([skill])) : skills
  const unassigned = showUnassigned && !hasVoicePart(skills)
  if (shown.length === 0 && !unassigned) return null
  return (
    <Flex wrap gap={4} align="center">
      {unassigned && <UnassignedVoiceCell />}
      {shown.map((skill) => (
        <Tag key={skill} icon={hasVoicePart([skill]) ? <VoicePartIcon name={skill} /> : undefined} style={{ marginInlineEnd: 0 }}>
          {skill}
        </Tag>
      ))}
    </Flex>
  )
}
