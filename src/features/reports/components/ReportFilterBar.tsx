import { DatePicker, Flex, Select, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { FilterBar, SELECT_POPUP_PROPS } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { hasActiveReportFilters } from '../reportFilters'
import type { ReportFilters } from '../types'

export interface FilterOption {
  value: string
  label: string
}

export interface ReportFilterBarProps {
  value: ReportFilters
  onChange: (value: ReportFilters) => void
  onReset: () => void
  /** Liturgical seasons (FE-50) to filter by. */
  seasons: FilterOption[]
  /** Choirs to filter the per-member reports by; the filter is shown only when given. */
  choirs?: FilterOption[]
  /** Explains when the active report tab does not filter by choir (disables control). */
  choirDisabledReason?: string
  /** Clarifies choir filter scope without disabling the control (e.g. when a chart still uses it). */
  choirScopeNote?: string
}

/** Server-side report filters of SearchReportsRequest: month (FE-53), liturgical season and, for the Admin, choir. */
export function ReportFilterBar({
  value,
  onChange,
  onReset,
  seasons,
  choirs,
  choirDisabledReason,
  choirScopeNote,
}: Readonly<ReportFilterBarProps>) {
  // A visible label: once a value is chosen the placeholder is gone and the filters would look alike.
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }

  const choirControl = (
    <Select
      {...SELECT_POPUP_PROPS}
      id="report-filter-choirId"
      allowClear
      showSearch
      disabled={Boolean(choirDisabledReason)}
      optionFilterProp="label"
      placeholder={choirDisabledReason ? 'Không áp dụng cho báo cáo này' : 'Tất cả ca đoàn'}
      value={choirDisabledReason ? undefined : value.choirId}
      onChange={(choirId?: string) => onChange({ ...value, choirId })}
      options={choirs}
      style={{ width: '100%' }}
    />
  )

  return (
    <Flex vertical gap={spacing.xs} style={{ marginBottom: spacing.md }}>
      <FilterBar hideResultCount hasActiveFilters={hasActiveReportFilters(value)} onReset={onReset}>
        <Flex vertical gap={4} style={{ flex: '0 1 180px', minWidth: 160 }}>
          <label htmlFor="report-filter-month" style={labelStyle}>
            Tháng
          </label>
          <DatePicker
            getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
            placement="bottomLeft"
            id="report-filter-month"
            picker="month"
            format="MM/YYYY"
            placeholder="Tất cả các tháng"
            value={value.month ? dayjs(`${value.month}-01`) : null}
            onChange={(month) => onChange({ ...value, month: month ? month.format('YYYY-MM') : undefined })}
            style={{ width: '100%' }}
          />
        </Flex>
        <Flex vertical gap={4} style={{ flex: '0 1 220px', minWidth: 180 }}>
          <label htmlFor="report-filter-seasonId" style={labelStyle}>
            Mùa phụng vụ
          </label>
          <Select
            {...SELECT_POPUP_PROPS}
            id="report-filter-seasonId"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Tất cả mùa phụng vụ"
            value={value.seasonId}
            onChange={(seasonId?: string) => onChange({ ...value, seasonId })}
            options={seasons}
            style={{ width: '100%' }}
          />
        </Flex>
        {choirs && (
          <Flex vertical gap={4} style={{ flex: '0 1 260px', minWidth: 180 }}>
            <label htmlFor="report-filter-choirId" style={labelStyle}>
              Ca đoàn
            </label>
            {choirDisabledReason ? (
              <Tooltip title={choirDisabledReason} trigger={['hover', 'focus']}>
                {choirControl}
              </Tooltip>
            ) : (
              choirControl
            )}
          </Flex>
        )}
      </FilterBar>
      {choirs && !choirDisabledReason && choirScopeNote && (
        <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted, paddingInline: spacing.xs }}>
          {choirScopeNote}
        </Typography.Text>
      )}
    </Flex>
  )
}
