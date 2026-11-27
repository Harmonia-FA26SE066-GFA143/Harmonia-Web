import { Flex, Typography } from 'antd'
import { Icon } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import type { NominationStats } from '../types'

/** The member's record against the thresholds. A threshold not met is a warning only: the Parish Priest still decides. */
export function NominationStatsList({ stats }: Readonly<{ stats: NominationStats }>) {
  const rows = [
    { label: 'Thâm niên', value: `${stats.tenureMonths} tháng, cần ${stats.minTenureMonths} tháng`, met: stats.meetsTenure },
    {
      label: 'Đi tập 12 tháng qua',
      value: stats.attendancePercent === null ? `Chưa có điểm danh, cần ${stats.minAttendancePercent}%` : `${stats.attendancePercent}% (${stats.attendancePresent}/${stats.attendanceRecorded} buổi), cần ${stats.minAttendancePercent}%`,
      met: stats.meetsAttendance,
    },
    { label: 'Số lễ đã phục vụ', value: `${stats.servedEventCount} lễ, cần ${stats.minServedEvents} lễ`, met: stats.meetsServedEvents },
    {
      label: 'Kỹ năng bắt nhịp',
      value: `${stats.hasConductingSkill ? 'Đã có' : 'Chưa có'}${stats.isConductingSkillRequired ? ', bắt buộc' : ', không bắt buộc'}`,
      met: stats.meetsConductingSkill,
    },
  ]
  return (
    <div className="hm-form-context" style={{ marginBottom: 0 }}>
      <Flex component="ul" vertical gap={spacing.xs} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {rows.map(({ label, value, met }, index) => (
          <Flex
            component="li"
            key={label}
            gap={spacing.sm}
            align="baseline"
            justify="space-between"
            wrap
            style={{
              paddingTop: index > 0 ? spacing.xs : 0,
              borderTop: index > 0 ? `1px solid ${colors.border}` : undefined,
            }}
          >
            <Flex gap={spacing.xs} align="baseline" style={{ minWidth: 0 }}>
              <span aria-hidden style={{ color: met ? 'var(--hm-success)' : 'var(--hm-warning)', flexShrink: 0 }}>
                {met ? <Icon name="check-circle" /> : <Icon name="warning" />}
              </span>
              <Typography.Text>
                <strong>{label}:</strong> {value}.{' '}
                <span style={{ color: met ? 'var(--hm-success)' : 'var(--hm-area-attention-ink)', fontWeight: 600 }}>
                  {met ? 'Đạt.' : 'Chưa đạt.'}
                </span>
              </Typography.Text>
            </Flex>
          </Flex>
        ))}
      </Flex>
    </div>
  )
}
