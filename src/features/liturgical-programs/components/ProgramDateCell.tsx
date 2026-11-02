import { Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { colors, sections, typography } from '@/styles/tokens'

/**
 * The day of a program in a list: its day of the month large (decorative, as on the program pages), the weekday, and
 * the date and time in words as the table always wrote them.
 */
export function ProgramDateCell({ date, label }: Readonly<{ date: string; label: string }>) {
  const day = dayjs(date)
  const weekday = day.format('dddd')
  return (
    <Flex align="center" gap={12} style={{ whiteSpace: 'nowrap' }}>
      <span aria-hidden style={{ minWidth: 34, fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 30, lineHeight: 1, color: sections.liturgy.cloth, fontVariantNumeric: 'lining-nums' }}>
        {day.format('DD')}
      </span>
      <Flex vertical>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
          {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
        </Typography.Text>
        <Typography.Text style={{ fontVariantNumeric: 'tabular-nums' }}>{label}</Typography.Text>
      </Flex>
    </Flex>
  )
}
