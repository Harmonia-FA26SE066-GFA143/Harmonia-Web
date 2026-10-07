import { Card, Descriptions, Typography } from 'antd'
import dayjs from 'dayjs'
import { parseUtc } from '@/lib/api/dates'
import { colors, typography } from '@/styles/tokens'
import { useEventNames } from '../hooks/useEventNames'
import { formatProgramDate } from '../programFilters'
import type { LiturgicalEvent } from '../types'
import { EventStatusTag } from './EventStatusTag'

const orNone = (value?: string) => value || <Typography.Text style={{ color: colors.textMuted }}>Không có</Typography.Text>
const numeric = { fontFamily: typography.fontFamilyNumeric }

/** Every field of a liturgical event (`LiturgicalEventDto`). */
export function EventInfo({ event }: { event: LiturgicalEvent }) {
  const { name } = useEventNames()

  return (
    <Card title="Thông tin sự kiện">
      <Descriptions
        column={{ xs: 1, md: 2 }}
        items={[
          { key: 'title', label: 'Tiêu đề', children: orNone(event.title) },
          { key: 'status', label: 'Trạng thái', children: <EventStatusTag status={event.status} /> },
          { key: 'date', label: 'Ngày cử hành', children: <span style={numeric}>{formatProgramDate(event.date)}</span> },
          { key: 'time', label: 'Giờ', children: <span style={numeric}>{event.time}</span> },
          { key: 'location', label: 'Nơi cử hành', children: event.locationName },
          { key: 'category', label: 'Loại sự kiện', children: orNone(name('category', event.categoryId)) },
          { key: 'season', label: 'Mùa phụng vụ', children: orNone(name('season', event.seasonId)) },
          { key: 'massType', label: 'Loại Thánh lễ', children: orNone(name('massType', event.massTypeId)) },
          { key: 'ceremonyType', label: 'Loại nghi thức', children: orNone(name('ceremonyType', event.ceremonyTypeId)) },
          {
            key: 'published',
            label: 'Công bố lúc',
            children: event.publishedAt ? (
              <span style={numeric}>{dayjs(parseUtc(event.publishedAt)).format('DD/MM/YYYY HH:mm')}</span>
            ) : (
              orNone()
            ),
          },
          { key: 'special', label: 'Yêu cầu đặc biệt', span: 'filled', children: orNone(event.specialRequirements) },
        ]}
      />
    </Card>
  )
}
