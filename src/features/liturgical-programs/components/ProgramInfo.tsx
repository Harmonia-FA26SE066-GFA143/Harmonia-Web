import { Card, Descriptions, Typography } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { formatProgramDate } from '../programFilters'
import type { CatalogRef, LiturgicalProgram } from '../types'

const orNone = (value?: string) => value || <Typography.Text style={{ color: colors.textMuted }}>Không có</Typography.Text>
const refName = (ref?: CatalogRef) => orNone(ref?.name)

/** FE-16 event information of a program. Shared by the Priest and Choir Director detail pages. */
export function ProgramInfo({ program }: { program: LiturgicalProgram }) {
  return (
    <Card title="Thông tin chương trình">
      <Descriptions
        column={{ xs: 1, md: 2 }}
        items={[
          { key: 'name', label: 'Tên sự kiện', children: program.eventName },
          {
            key: 'date',
            label: 'Ngày cử hành',
            children: <span style={{ fontFamily: typography.fontFamilyNumeric }}>{formatProgramDate(program.date)}</span>,
          },
          { key: 'season', label: 'Mùa phụng vụ', children: refName(program.season) },
          { key: 'massType', label: 'Loại Thánh lễ', children: refName(program.massType) },
          { key: 'ceremonyType', label: 'Loại nghi thức', children: refName(program.ceremonyType) },
          { key: 'special', label: 'Yêu cầu đặc biệt', span: 'filled', children: orNone(program.specialRequirements) },
        ]}
      />
    </Card>
  )
}
