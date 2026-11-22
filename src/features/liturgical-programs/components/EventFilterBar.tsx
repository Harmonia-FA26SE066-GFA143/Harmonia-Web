import { DatePicker, Flex, Select } from 'antd'
import dayjs from 'dayjs'
import type { CSSProperties, ReactNode } from 'react'
import { FilterBar, filterAllPlaceholder, SELECT_POPUP_PROPS, visuallyHidden } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { hasActiveEventFilters } from '../programFilters'
import { eventStatusLabels, type EventFilters, type EventStatus } from '../types'

export interface EventFilterBarProps {
  value: EventFilters
  onChange: (value: EventFilters) => void
  onReset: () => void
  resultCount: number
  /** Statuses offered; the Choir Director never sees drafts. */
  statuses?: EventStatus[]
  /** A control before the status (the Director's "Sắp tới / Đã qua"). */
  leading?: ReactNode
  /** What the count counts; "sự kiện" by default. */
  unit?: string
  /** Space around the bar, e.g. its bottom margin outside a card. */
  style?: CSSProperties
  /** The list query failed: the count says so instead of a number. */
  error?: boolean
}

/** The filters GET /api/liturgical-events offers: status and a date range. */
const allStatuses = Object.keys(eventStatusLabels) as EventStatus[]

export function EventFilterBar({
  value,
  onChange,
  onReset,
  resultCount,
  statuses = allStatuses,
  leading,
  unit = 'sự kiện',
  style,
  error,
}: Readonly<EventFilterBarProps>) {
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }
  return (
    <div style={style}>
      <FilterBar resultCount={resultCount} error={error} resultNoun={unit} hasActiveFilters={hasActiveEventFilters(value)} onReset={onReset}>
        {leading}
        <Flex vertical gap={4} style={{ flex: '0 1 200px', minWidth: 170 }}>
          <label htmlFor="event-filter-status" style={labelStyle}>
            Trạng thái
          </label>
          <Select
            {...SELECT_POPUP_PROPS}
            id="event-filter-status"
            allowClear
            placeholder={filterAllPlaceholder('trạng thái')}
            value={value.status}
            onChange={(status?: EventStatus) => onChange({ ...value, status })}
            options={statuses.map((status) => ({
              value: status,
              label: eventStatusLabels[status],
            }))}
          />
        </Flex>
        <Flex vertical gap={4} style={{ flex: '1 1 260px', maxWidth: 320 }}>
          <label htmlFor="event-filter-dates" style={labelStyle}>
            Khoảng ngày
          </label>
          {/* Names the second input of the range; the visible label above names the first. */}
          <label htmlFor="event-filter-dates-end" style={visuallyHidden}>
            Khoảng ngày, đến ngày
          </label>
          <DatePicker.RangePicker
            id={{ start: 'event-filter-dates', end: 'event-filter-dates-end' }}
            getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
            placement="bottomLeft"
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
            allowEmpty={[true, true]}
            value={[value.fromDate ? dayjs(value.fromDate) : null, value.toDate ? dayjs(value.toDate) : null]}
            onChange={(range) =>
              onChange({
                ...value,
                fromDate: range?.[0]?.format('YYYY-MM-DD'),
                toDate: range?.[1]?.format('YYYY-MM-DD'),
              })
            }
          />
        </Flex>
      </FilterBar>
    </div>
  )
}
