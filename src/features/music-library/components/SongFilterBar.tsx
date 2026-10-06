import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { useCatalogOptions, type CatalogOption } from '@/features/system-categories'
import { colors, spacing } from '@/styles/tokens'
import { hasActiveSongFilters } from '../songFilters'
import type { SongFilters } from '../types'

export interface SongFilterBarProps {
  value: SongFilters
  onChange: (value: SongFilters) => void
  onReset: () => void
  /** Songs matching the filters on the server, across all pages. */
  resultCount: number
}

/** Search over title, composer and lyricist, and the FE-29 classification filters of GET /api/songs. */
export function SongFilterBar({ value, onChange, onReset, resultCount }: SongFilterBarProps) {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')
  const themes = useCatalogOptions('songThemes')
  const skills = useCatalogOptions('skills')

  const selects: { key: Exclude<keyof SongFilters, 'search'>; label: string; placeholder: string; options: CatalogOption[] }[] = [
    { key: 'seasonId', label: 'Mùa phụng vụ', placeholder: 'Tất cả mùa phụng vụ', options: seasons },
    { key: 'massTypeId', label: 'Loại Thánh lễ', placeholder: 'Tất cả loại Thánh lễ', options: massTypes },
    { key: 'ceremonyTypeId', label: 'Loại nghi thức', placeholder: 'Tất cả loại nghi thức', options: ceremonyTypes },
    { key: 'themeId', label: 'Chủ đề', placeholder: 'Tất cả chủ đề', options: themes },
    { key: 'skillId', label: 'Bè giọng hoặc nhạc cụ', placeholder: 'Tất cả bè giọng, nhạc cụ', options: skills },
  ]

  return (
    <Flex vertical gap={spacing.md} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo tên bài hát, nhạc sĩ, người viết lời"
        aria-label="Tìm bài hát"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ maxWidth: 420 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: spacing.sm }}>
        {selects.map((select) => (
          <Select
            key={select.key}
            allowClear
            showSearch
            optionFilterProp="label"
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
