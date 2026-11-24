import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { ACTIONS_COLUMN_TITLE } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { useEventNames } from '../hooks/useEventNames'
import { formatProgramDate } from '../programFilters'
import type { LiturgicalEvent } from '../types'
import { EventStatusTag } from './EventStatusTag'
import { ProgramDateCell } from './ProgramDateCell'

export interface EventTableProps {
  events: LiturgicalEvent[]
  onOpen: (event: LiturgicalEvent) => void
  /** Server-side paging of GET /api/liturgical-events; omit to show all rows. */
  pagination?: TablePaginationConfig | false
  loading?: boolean
  /** Checkboxes on the rows `selectable` admits; omit for a table without selection. */
  selection?: { selectedIds: string[]; onChange: (ids: string[]) => void; selectable: (event: LiturgicalEvent) => boolean }
  /** The event shown in the preview beside the list; a row click picks it. */
  pickedId?: string
  onPick?: (event: LiturgicalEvent) => void
}

/** Liturgical events of the Priest with date, time, place and status. */
export function EventTable({ events, onOpen, pagination = false, loading, selection, pickedId, onPick }: Readonly<EventTableProps>) {
  const { name, eventName } = useEventNames()
  const columns: TableColumnsType<LiturgicalEvent> = [
    {
      key: 'when',
      title: 'Ngày giờ',
      width: 200,
      render: (_, event) => <ProgramDateCell date={event.date} label={`${formatProgramDate(event.date)} · ${event.time}`} />,
    },
    {
      key: 'name',
      title: 'Sự kiện',
      render: (_, event) => (
        <Flex vertical>
          <Typography.Text strong delete={event.status === 'cancelled'}>
            {eventName(event)}
          </Typography.Text>
          {name('season', event.seasonId) && (
            <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
              {name('season', event.seasonId)}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    { key: 'location', title: 'Nơi cử hành', width: 200, render: (_, event) => event.locationName },
    { key: 'status', title: 'Trạng thái', width: 130, render: (_, event) => <EventStatusTag status={event.status} /> },
    {
      key: 'actions',
      title: ACTIONS_COLUMN_TITLE,
      align: 'center',
      width: 120,
      render: (_, event) => (
        <Button
          onClick={(click) => {
            click.stopPropagation()
            onOpen(event)
          }}
          aria-label={`Xem chi tiết ${eventName(event)} ngày ${formatProgramDate(event.date)}`}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <Table<LiturgicalEvent>
      rowKey="id"
      className={onPick && 'hm-table-pick'}
      rowClassName={(event) => (event.id === pickedId ? 'is-picked' : '')}
      onRow={(event) => ({ onClick: () => onPick?.(event) })}
      columns={columns}
      dataSource={events}
      loading={loading}
      rowSelection={
        selection && {
          selectedRowKeys: selection.selectedIds,
          onChange: (keys) => selection.onChange(keys.map(String)),
          getCheckboxProps: (event) => ({ disabled: !selection.selectable(event), 'aria-label': `Chọn ${eventName(event)} ngày ${formatProgramDate(event.date)}` }),
        }
      }
      pagination={pagination}
      // A fixed width, not the content's: long event names wrap instead of pushing the table sideways.
      scroll={{ x: 900 }}
    />
  )
}
