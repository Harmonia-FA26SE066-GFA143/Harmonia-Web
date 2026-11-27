import { Button, Flex, Input, Select, TreeSelect, Typography, type InputRef } from 'antd'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { themeTreeData, useCatalogOptions, useLookup, type CatalogOption } from '@/features/system-categories'
import { FILTER_ALL_PREFIX, FILTER_RESET_LABEL, filterAllPlaceholder, Icon, resultCountLabel, SELECT_POPUP_PROPS } from '@/shared/ui'
import { colors, gold, radius, sizes, spacing, typography } from '@/styles/tokens'
import { materialKindLabels, materialKinds, type SongFilters } from '../types'

export interface SongFilterBarProps {
  value: SongFilters
  onChange: (value: SongFilters) => void
  onReset: () => void
  /** Songs matching the filters on the server, across all pages. */
  resultCount?: number
  /** True when the backing songs query failed (`isError`), preventing a stuck "Đang tải…" status (R2.5). */
  error?: boolean
  /** Additional controls placed on the right of the result count row (e.g. ViewSwitcher). */
  extra?: ReactNode
  /** Show primary filters directly on the library page; pickers keep all filters collapsed. */
  libraryLayout?: boolean
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
 * Search over title, composer and lyricist, three visible liturgical filters and one additional "Bộ lọc" panel with the
 * FE-29 classification filters of GET /api/songs (a theme also finds its sub-themes' songs) and the library checks:
 * songs not classified yet, songs missing a kind of material. Active filters show as chips, so the panel can stay shut.
 */
export function SongFilterBar({
  value,
  onChange,
  onReset,
  resultCount,
  error = false,
  extra,
  libraryLayout = false,
}: Readonly<SongFilterBarProps>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value.search)
  const composing = useRef(false)
  const searchInput = useRef<InputRef>(null)
  // A removed chip takes the keyboard focus with it; it moves to the Bộ lọc button instead of the page start.
  const filterButton = useRef<HTMLButtonElement>(null)
  const themes = themeTreeData(useLookup('songThemes').data ?? [])

  // Keep external changes (Back, reset, a shared URL) in sync, but never replace an unfinished IME composition.
  useEffect(() => {
    if (!composing.current) setSearch(value.search)
  }, [value.search])

  useEffect(() => {
    if (!libraryLayout) return
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      if (document.querySelector('[role="dialog"]')) return
      event.preventDefault()
      searchInput.current?.focus()
    }
    document.addEventListener('keydown', focusSearch)
    return () => document.removeEventListener('keydown', focusSearch)
  }, [libraryLayout])

  const commitSearch = (next: string) => onChange({ ...value, search: next })

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
      placeholder: filterAllPlaceholder('tài liệu thiếu'),
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
    <Flex key={key} vertical gap={spacing.xs} style={{ minWidth: 0 }}>
      <label htmlFor={`song-filter-${key}`} style={labelStyle}>
        {label}
      </label>
      {control}
    </Flex>
  )

  const selectField = (select: (typeof selects)[number]) => field(
    select.key,
    select.label,
    <Select
      {...SELECT_POPUP_PROPS}
      id={`song-filter-${select.key}`}
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder={select.placeholder ?? FILTER_ALL_PREFIX}
      value={value[select.key]}
      onChange={(selected?: string) => set(select.key, selected)}
      options={select.options}
    />,
  )

  const themeField = field('themeId', 'Chủ đề',
    <TreeSelect
      {...SELECT_POPUP_PROPS}
      id="song-filter-themeId"
      allowClear
      showSearch
      treeNodeFilterProp="title"
      treeDefaultExpandAll
      placeholder={FILTER_ALL_PREFIX}
      value={value.themeId}
      onChange={(themeId?: string) => set('themeId', themeId)}
      treeData={themes}
    />,
  )

  const searchField = (
    <Flex vertical gap={spacing.xs} style={libraryLayout ? { minWidth: 0 } : { flex: '0 1 420px', minWidth: 0 }}>
      <label htmlFor="song-filter-search" style={labelStyle}>
        Tìm bài hát
      </label>
      <Input
        ref={searchInput}
        id="song-filter-search"
        aria-keyshortcuts={libraryLayout ? '/' : undefined}
        allowClear
        // GET /api/songs refuses a longer keyword (Harmonia-BE SearchSongsRequestValidator.cs:10, MaximumLength(100)).
        maxLength={100}
        prefix={<Icon name="search" />}
        placeholder="Tên bài hát, nhạc sĩ, người viết lời"
        value={search}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={(event) => {
          composing.current = false
          setSearch(event.currentTarget.value)
          commitSearch(event.currentTarget.value)
        }}
        onChange={(event) => {
          const next = event.target.value
          setSearch(next)
          if (!composing.current) commitSearch(next)
        }}
      />
    </Flex>
  )

  // The library shows season, Mass part and theme on its console (artifact SongLibraryPage); the panel keeps the rest.
  const onConsole = (key: FilterKey) => libraryLayout && (key === 'seasonId' || key === 'slotId' || key === 'themeId')
  const panelCount = chips.filter((chip) => !onConsole(chip.key)).length

  const filterToggle = (
    <Button
      ref={filterButton}
      icon={<Icon name="filter" />}
      aria-expanded={open}
      aria-controls="song-filter-panel"
      onClick={() => setOpen(!open)}
    >
      {(libraryLayout ? 'Bộ lọc khác' : 'Bộ lọc') + (panelCount > 0 ? ` (${panelCount})` : '')}
    </Button>
  )

  return (
    <Flex vertical gap={spacing.sm + 4} style={libraryLayout
      ? { padding: spacing.md, background: colors.ivory, border: `1px solid ${colors.border}`, borderTop: `1px solid ${gold.line}`, borderRadius: radius.lg }
      : { padding: spacing.md }}>
      {libraryLayout ? (
        <div className="song-console">
          {searchField}
          {selects.filter((select) => onConsole(select.key)).map(selectField)}
          {themeField}
          {filterToggle}
        </div>
      ) : (
        <Flex align="end" gap={spacing.sm} wrap>
          {searchField}
          {filterToggle}
        </Flex>
      )}

      {/* Kept in the page while shut (hidden), so aria-controls always points at it. */}
      <div
        id="song-filter-panel"
        // Equal columns from global.css (G3-10/16); the grid only applies while open.
        className="song-filter-panel__grid"
        hidden={!open}
        style={{
          gap: spacing.md,
          padding: spacing.md,
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.md,
        }}
      >
        {libraryLayout ? selects.filter((select) => !onConsole(select.key)).map(selectField) : (
          <>
            {selects.slice(0, 3).map(selectField)}
            {themeField}
            {selects.slice(3).map(selectField)}
          </>
        )}
      </div>

      {(chips.length > 0 || value.search.trim()) && (
        <Flex align="center" gap={spacing.sm} wrap aria-label="Bộ lọc đang dùng" role="group">
          {chips.map((chip) => (
            <Button
              key={chip.key}
              style={{ minHeight: sizes.controlHeight, height: 'auto', whiteSpace: 'normal', textAlign: 'start' }}
              icon={<Icon name="close" />}
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
            type="link"
            onClick={() => {
              onReset()
              filterButton.current?.focus()
            }}
          >
            {FILTER_RESET_LABEL}
          </Button>
        </Flex>
      )}

      <Flex justify="space-between" align="center" wrap gap={spacing.sm}>
        <Typography.Text role="status" aria-atomic style={{ color: error ? colors.error : colors.textMuted }}>
          {resultCountLabel(resultCount, 'bài hát', error)}
        </Typography.Text>
        {extra}
      </Flex>
    </Flex>
  )
}
