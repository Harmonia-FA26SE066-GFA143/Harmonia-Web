import { CardTitle } from '@/shared/ui'
import { Card, Descriptions, Typography } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { formatProgramDate } from '../programFilters'
import type { LiturgicalProgram } from '../types'

const orNone = (value?: string) => value || <Typography.Text style={{ color: colors.textMuted }}>Không có</Typography.Text>

/** FE-16 event information of a program, for the Choir Director pages. */
export function ProgramInfo({ program }: Readonly<{ program: LiturgicalProgram }>) {
  return (
    <Card title={<CardTitle>Thông tin chương trình</CardTitle>}>
      <Descriptions
        column={{ xs: 1, md: 2 }}
        items={[
          { key: 'name', label: 'Tên sự kiện', children: program.eventName },
          {
            key: 'date',
            label: 'Ngày giờ cử hành',
            children: (
              <span style={{ fontFamily: typography.fontFamilyNumeric }}>
                {program.time} · {formatProgramDate(program.date)}
              </span>
            ),
          },
          { key: 'location', label: 'Nơi cử hành', children: program.locationName },
          { key: 'season', label: 'Mùa phụng vụ', children: orNone(program.seasonName) },
          { key: 'massType', label: 'Loại Thánh lễ', children: orNone(program.massTypeName) },
          { key: 'ceremonyType', label: 'Loại nghi thức', children: orNone(program.ceremonyTypeName) },
          { key: 'special', label: 'Yêu cầu đặc biệt', span: 'filled', children: orNone(program.specialRequirements) },
        ]}
      />
    </Card>
  )
}
