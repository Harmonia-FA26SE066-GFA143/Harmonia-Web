import { CloseOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, TreeSelect, Typography } from 'antd'
import { useRef, useState, type ReactNode } from 'react'
import { themeTreeData, useCatalogOptions, useLookup, type CatalogOption } from '@/features/system-categories'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { materialKindLabels, materialKinds, type SongFilters } from '../types'

export interface SongFilterBarProps {
  value: SongFilters
  onChange: (value: SongFilters) => void
  onReset: () => void
  /** Songs matching the filters on the server, across all pages. */
  resultCount: number
  /** Additional controls placed on the right of the result count row (e.g. ViewSwitcher). */
  extra?: ReactNode
}

type FilterKey = Exclude<keyof SongFilters, 'search'>

interface TreeOption {
  value: string
  title: string
  children?: TreeOption[]
}

const findTitle = (nodes: TreeOption[], value: string): string | undefined => {
  for (const node of nodes) {
    if (node.value === value) return node.title
    const found = node.children && findTitle(node.children, value)
    if (found) return found
  }
  return undefined
}

const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }

/**
 * Search over title, composer and lyricist (case and Vietnamese diacritics ignored), and one "Bộ lọc" panel with the
 * FE-29 classification filters of GET /api/songs (a theme also finds its sub-themes' songs) and the library checks:
 * songs not classified yet, songs missing a kind of material. Active filters show as chips, so the panel can stay shut.
 */
export function SongFilterBar({ value, onChange, onReset, resultCount, extra }: Readonly<SongFilterBarProps>) {
  const [open, setOpen] = useState(false)
  // A removed chip takes the keyboard focus with it; it moves to the Bộ lọc button instead of the page start.
  const filterButton = useRef<HTMLButtonElement>(null)
  const themes = themeTreeData(useLookup('songThemes').data ?? [])

  // The order is the panel's and the chips': liturgy first, then the library checks.
  const selects: { key: FilterKey; label: string; placeholder?: string; options: CatalogOption[] }[] = [
    { key: 'seasonId', label: 'Mùa phụng vụ', options: useCatalogOptions('seasons') },
    { key: 'massTypeId', label: 'Loại Thánh lễ', options: useCatalogOptions('massTypes') },
    { key: 'ceremonyTypeId', label: 'Loại nghi thức', options: useCatalogOptions('ceremonyTypes') },
    { key: 'slotId', label: 'Phần phụng vụ', options: useCatalogOptions('liturgicalSlots') },
    { key: 'skillId', label: 'Bè giọng hoặc nhạc cụ', options: useCatalogOptions('skills') },
    {
      key: 'classified',
      label: 'Phân loại',
      options: [
        { value: 'no', label: 'Chưa phân loại' },
        { value: 'yes', label: 'Đã phân loại' },
      ],
    },
    {
      key: 'missingMaterial',
      label: 'Thiếu tài liệu',
      placeholder: 'Không lọc',
      options: materialKinds.map((kind) => ({ value: kind, label: `Chưa có ${materialKindLabels[kind].toLowerCase()}` })),
    },
  ]

  const set = (key: FilterKey, selected?: string) => onChange({ ...value, [key]: selected })

  const chipOf = (select: (typeof selects)[number]) => {
    const selected = value[select.key]
    return selected && { key: select.key, text: `${select.label}: ${select.options.find((option) => option.value === selected)?.label ?? selected}` }
  }
  const chips = [
    ...selects.slice(0, 3).map(chipOf),
    value.themeId && { key: 'themeId' as const, text: `Chủ đề: ${findTitle(themes, value.themeId) ?? value.themeId}` },
    ...selects.slice(3).map(chipOf),
  ].filter((chip): chip is { key: FilterKey; text: string } => Boolean(chip))

  const field = (key: FilterKey, label: string, control: ReactNode) => (
    <Flex key={key} vertical gap={spacing.xs}>
      <label htmlFor={`song-filter-${key}`} style={labelStyle}>
        {label}
      </label>
      {control}
    </Flex>
  )

  return (
    <Flex vertical gap={spacing.md} style={{ padding: spacing.md }}>
      <Flex align="end" gap={spacing.sm} wrap>
        <Flex vertical gap={spacing.xs} style={{ flex: '0 1 420px' }}>
          <label htmlFor="song-filter-search" style={labelStyle}>
            Tìm bài hát
          </label>
          <Input
            id="song-filter-search"
            allowClear
            prefix={<SearchOutlined aria-hidden />}
            placeholder="Tên bài hát, nhạc sĩ, người viết lời"
            value={value.search}
            onChange={(event) => onChange({ ...value, search: event.target.value })}
          />
        </Flex>
        <Button
          ref={filterButton}
          icon={<FilterOutlined />}
          aria-expanded={open}
          aria-controls="song-filter-panel"
          onClick={() => setOpen(!open)}
        >
          {chips.length > 0 ? `Bộ lọc (${chips.length})` : 'Bộ lọc'}
        </Button>
      </Flex>

      {/* Kept in the page while shut (hidden), so aria-controls always points at it. */}
      <div
        id="song-filter-panel"
        hidden={!open}
        style={{
          display: open ? 'grid' : undefined,
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: spacing.md,
          padding: spacing.md,
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
        }}
      >
        {selects.slice(0, 3).map((select) =>
          field(
            select.key,
            select.label,
            <Select
              id={`song-filter-${select.key}`}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả"
              value={value[select.key]}
              onChange={(selected?: string) => set(select.key, selected)}
              options={select.options}
            />,
          ),
        )}
        {/* The theme sits with the liturgical filters, as a tree: a theme also finds its sub-themes' songs. */}
        {field(
          'themeId',
          'Chủ đề',
          <TreeSelect
            id="song-filter-themeId"
            allowClear
            showSearch
            treeNodeFilterProp="title"
            treeDefaultExpandAll
            placeholder="Tất cả"
            value={value.themeId}
            onChange={(themeId?: string) => set('themeId', themeId)}
            treeData={themes}
          />,
        )}
        {selects.slice(3).map((select) =>
          field(
            select.key,
            select.label,
            <Select
              id={`song-filter-${select.key}`}
              allowClear
              showSearch={select.options.length > 5}
              optionFilterProp="label"
              placeholder={select.placeholder ?? 'Tất cả'}
              value={value[select.key]}
              onChange={(selected?: string) => set(select.key, selected)}
              options={select.options}
            />,
          ),
        )}
      </div>

      {chips.length > 0 && (
        <Flex align="center" gap={spacing.sm} wrap aria-label="Bộ lọc đang dùng" role="group">
          {chips.map((chip) => (
            <Button
              key={chip.key}
              size="small"
              icon={<CloseOutlined aria-hidden />}
              iconPlacement="end"
              aria-label={`Bỏ lọc ${chip.text}`}
              onClick={() => {
                set(chip.key, undefined)
                filterButton.current?.focus()
              }}
            >
              {chip.text}
            </Button>
          ))}
          <Button
            size="small"
            type="link"
            onClick={() => {
              onReset()
              filterButton.current?.focus()
            }}
          >
            Xoá tất cả bộ lọc
          </Button>
        </Flex>
      )}

      <Flex justify="space-between" align="center" wrap gap={spacing.sm}>
        <Typography.Text role="status" aria-atomic style={{ color: colors.textMuted }}>
          {resultCount} bài hát
        </Typography.Text>
        {extra}
      </Flex>
    </Flex>
  )
}
