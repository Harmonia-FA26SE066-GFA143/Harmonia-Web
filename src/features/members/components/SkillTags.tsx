import { Flex, Tag, Typography } from 'antd'
import { colors } from '@/styles/tokens'

/** A member's approved skills as neutral tags; "—" when none are recorded. */
export function SkillTags({ skills }: { skills: string[] }) {
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
