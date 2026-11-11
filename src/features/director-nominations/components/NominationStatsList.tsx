import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Flex, Typography } from 'antd'
import { spacing } from '@/styles/tokens'
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
    <Flex component="ul" vertical gap={spacing.xs} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {rows.map(({ label, value, met }) => (
        <Flex component="li" key={label} gap={spacing.sm} align="baseline">
          <span aria-hidden style={{ color: met ? "var(--hm-success)" : "var(--hm-warning)" }}>{met ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}</span>
          <Typography.Text>
            <strong>{label}:</strong> {value}. {met ? 'Đạt.' : 'Chưa đạt.'}
          </Typography.Text>
        </Flex>
      ))}
    </Flex>
  )
}
