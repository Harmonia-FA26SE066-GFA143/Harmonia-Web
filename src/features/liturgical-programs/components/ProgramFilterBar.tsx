import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { colors, spacing } from '@/styles/tokens'
import { hasActiveProgramFilters } from '../programFilters'
import type { ProgramFilters } from '../types'

export interface ProgramFilterBarProps {
  value: ProgramFilters
  onChange: (value: ProgramFilters) => void
  onReset: () => void
  resultCount: number
}

/** Keyword and FE-50 catalog filters for program lists. */
export function ProgramFilterBar({ value, onChange, onReset, resultCount }: ProgramFilterBarProps) {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')

  const selects = [
    { key: 'seasonId', label: 'Lọc theo mùa phụng vụ', placeholder: 'Tất cả mùa phụng vụ', options: seasons },
    { key: 'massTypeId', label: 'Lọc theo loại Thánh lễ', placeholder: 'Tất cả loại Thánh lễ', options: massTypes },
    {
      key: 'ceremonyTypeId',
      label: 'Lọc theo loại nghi thức',
      placeholder: 'Tất cả loại nghi thức',
      options: ceremonyTypes,
    },
  ] as const

  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo tên sự kiện…"
        aria-label="Tìm chương trình phụng vụ"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ flex: '1 1 240px', maxWidth: 320 }}
      />
      {selects.map((select) => (
        <Select
          key={select.key}
          allowClear
          aria-label={select.label}
          placeholder={select.placeholder}
          value={value[select.key]}
          onChange={(selected?: string) => onChange({ ...value, [select.key]: selected })}
          options={select.options}
          style={{ flex: '0 1 200px', minWidth: 170 }}
        />
      ))}
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveProgramFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} chương trình
      </Typography.Text>
    </Flex>
  )
}
