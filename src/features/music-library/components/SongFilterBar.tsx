import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, TreeSelect, Typography } from 'antd'
import { themeTreeData, useCatalogOptions, useLookup, type CatalogOption } from '@/features/system-categories'
import { colors, spacing, typography } from '@/styles/tokens'
import { hasActiveSongFilters } from '../songFilters'
import { materialKindLabels, materialKinds, type MaterialKind, type SongFilters } from '../types'

export interface SongFilterBarProps {
  value: SongFilters
  onChange: (value: SongFilters) => void
  onReset: () => void
  /** Songs matching the filters on the server, across all pages. */
  resultCount: number
}

/**
 * Search over title, composer and lyricist (case and Vietnamese diacritics ignored), the FE-29 classification filters
 * of GET /api/songs (a theme also finds its sub-themes' songs), and the library checks: songs not classified yet, songs
 * missing a kind of material.
 */
export function SongFilterBar({ value, onChange, onReset, resultCount }: Readonly<SongFilterBarProps>) {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')
  const slots = useCatalogOptions('liturgicalSlots')
  const themes = themeTreeData(useLookup('songThemes').data ?? [])
  const skills = useCatalogOptions('skills')

  const selects: { key: Exclude<keyof SongFilters, 'search' | 'classified' | 'missingMaterial' | 'themeId'>; label: string; placeholder: string; options: CatalogOption[] }[] = [
    { key: 'seasonId', label: 'Mùa phụng vụ', placeholder: 'Tất cả mùa phụng vụ', options: seasons },
    { key: 'massTypeId', label: 'Loại Thánh lễ', placeholder: 'Tất cả loại Thánh lễ', options: massTypes },
    { key: 'ceremonyTypeId', label: 'Loại nghi thức', placeholder: 'Tất cả loại nghi thức', options: ceremonyTypes },
    { key: 'slotId', label: 'Phần phụng vụ', placeholder: 'Tất cả phần phụng vụ', options: slots },
    { key: 'skillId', label: 'Bè giọng hoặc nhạc cụ', placeholder: 'Tất cả bè giọng, nhạc cụ', options: skills },
  ]

  // A visible label: once a value is chosen the placeholder is gone and the selects would look alike.
  const renderSelect = (select: (typeof selects)[number]) => (
    <Flex key={select.key} vertical gap={4}>
      <label htmlFor={`song-filter-${select.key}`} style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
        {select.label}
      </label>
      <Select
        id={`song-filter-${select.key}`}
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder={select.placeholder}
        value={value[select.key]}
        onChange={(selected?: string) => onChange({ ...value, [select.key]: selected })}
        options={select.options}
        style={{ width: '100%' }}
      />
    </Flex>
  )

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
        {selects.slice(0, 3).map(renderSelect)}
        {/* The theme sits with the liturgical filters, as a tree: a theme also finds its sub-themes' songs. */}
        <Flex vertical gap={4}>
          <label htmlFor="song-filter-themeId" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
            Chủ đề
          </label>
          <TreeSelect
            id="song-filter-themeId"
            allowClear
            showSearch
            treeNodeFilterProp="title"
            treeDefaultExpandAll
            placeholder="Tất cả chủ đề"
            value={value.themeId}
            onChange={(themeId?: string) => onChange({ ...value, themeId })}
            treeData={themes}
            style={{ width: '100%' }}
          />
        </Flex>
        {selects.slice(3).map(renderSelect)}
        <Flex vertical gap={4}>
          <label htmlFor="song-filter-classified" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
            Phân loại
          </label>
          <Select
            id="song-filter-classified"
            allowClear
            placeholder="Tất cả bài hát"
            value={value.classified}
            onChange={(classified?: 'yes' | 'no') => onChange({ ...value, classified })}
            options={[
              { value: 'no', label: 'Chưa phân loại' },
              { value: 'yes', label: 'Đã phân loại' },
            ]}
            style={{ width: '100%' }}
          />
        </Flex>
        <Flex vertical gap={4}>
          <label htmlFor="song-filter-missingMaterial" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
            Thiếu tài liệu
          </label>
          <Select
            id="song-filter-missingMaterial"
            allowClear
            placeholder="Không lọc"
            value={value.missingMaterial}
            onChange={(missingMaterial?: MaterialKind) => onChange({ ...value, missingMaterial })}
            options={materialKinds.map((kind) => ({ value: kind, label: `Chưa có ${materialKindLabels[kind].toLowerCase()}` }))}
            style={{ width: '100%' }}
          />
        </Flex>
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
