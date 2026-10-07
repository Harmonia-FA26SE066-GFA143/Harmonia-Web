import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { useEventNames } from '../hooks/useEventNames'
import { formatProgramDate } from '../programFilters'
import type { LiturgicalEvent } from '../types'
import { EventStatusTag } from './EventStatusTag'

export interface EventTableProps {
  events: LiturgicalEvent[]
  onOpen: (event: LiturgicalEvent) => void
  /** Server-side paging of GET /api/liturgical-events; omit to show all rows. */
  pagination?: TablePaginationConfig | false
  loading?: boolean
}

const numeric = { fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' } as const

/** Liturgical events of the Priest with date, time, place and status. */
export function EventTable({ events, onOpen, pagination = false, loading }: EventTableProps) {
  const { name, eventName } = useEventNames()
  const columns: TableColumnsType<LiturgicalEvent> = [
    {
      key: 'name',
      title: 'Sự kiện',
      render: (_, event) => (
        <Flex vertical>
          <Typography.Text strong>{eventName(event)}</Typography.Text>
          {name('season', event.seasonId) && (
            <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
              {name('season', event.seasonId)}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'when',
      title: 'Ngày giờ',
      render: (_, event) => (
        <Typography.Text style={numeric}>
          {formatProgramDate(event.date)} · {event.time}
        </Typography.Text>
      ),
    },
    { key: 'location', title: 'Nơi cử hành', render: (_, event) => event.locationName },
    { key: 'status', title: 'Trạng thái', render: (_, event) => <EventStatusTag status={event.status} /> },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, event) => (
        <Button onClick={() => onOpen(event)} aria-label={`Xem chi tiết ${eventName(event)} ngày ${formatProgramDate(event.date)}`}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <Table<LiturgicalEvent>
      rowKey="id"
      columns={columns}
      dataSource={events}
      loading={loading}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
    />
  )
}
