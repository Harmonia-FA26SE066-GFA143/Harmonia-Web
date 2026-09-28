import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { colors, spacing } from '@/styles/tokens'
import { hasActiveSongFilters } from '../songFilters'
import type { SongFilters } from '../types'

export interface SongFilterBarProps {
  value: SongFilters
  onChange: (value: SongFilters) => void
  onReset: () => void
  resultCount: number
  /** Values recorded in the library for the free-text dimensions. */
  themes: string[]
  vocalRequirements: string[]
  instrumentRequirements: string[]
}

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }))

/** Title search and the six FE-29 classification filters. */
export function SongFilterBar({
  value,
  onChange,
  onReset,
  resultCount,
  themes,
  vocalRequirements,
  instrumentRequirements,
}: SongFilterBarProps) {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')

  const selects: { key: Exclude<keyof SongFilters, 'search'>; label: string; placeholder: string; options: { value: string; label: string }[] }[] = [
    { key: 'seasonId', label: 'Mùa phụng vụ', placeholder: 'Tất cả mùa phụng vụ', options: seasons },
    { key: 'massTypeId', label: 'Loại Thánh lễ', placeholder: 'Tất cả loại Thánh lễ', options: massTypes },
    { key: 'ceremonyTypeId', label: 'Loại nghi thức', placeholder: 'Tất cả loại nghi thức', options: ceremonyTypes },
    { key: 'theme', label: 'Chủ đề', placeholder: 'Tất cả chủ đề', options: toOptions(themes) },
    { key: 'vocalRequirements', label: 'Yêu cầu bè giọng', placeholder: 'Tất cả bè giọng', options: toOptions(vocalRequirements) },
    {
      key: 'instrumentRequirements',
      label: 'Yêu cầu nhạc cụ',
      placeholder: 'Tất cả nhạc cụ',
      options: toOptions(instrumentRequirements),
    },
  ]

  return (
    <Flex vertical gap={spacing.md} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo tên bài hát"
        aria-label="Tìm theo tên bài hát"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ maxWidth: 380 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: spacing.sm }}>
        {selects.map((select) => (
          <Select
            key={select.key}
            allowClear
            aria-label={`Lọc theo ${select.label.toLowerCase()}`}
            placeholder={select.placeholder}
            value={value[select.key]}
            onChange={(selected?: string) => onChange({ ...value, [select.key]: selected })}
            options={select.options}
            style={{ width: '100%' }}
          />
        ))}
      </div>
      <Flex align="center" justify="space-between" wrap gap={spacing.sm}>
        <Typography.Text aria-live="polite" style={{ color: colors.textMuted }}>
          {resultCount} bài hát
        </Typography.Text>
        <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveSongFilters(value)}>
          Đặt lại bộ lọc
        </Button>
      </Flex>
    </Flex>
  )
}
