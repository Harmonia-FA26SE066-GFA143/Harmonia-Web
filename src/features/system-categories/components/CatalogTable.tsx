import { Button, Card, Flex, Input, Select, Table, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import {
  ACTIONS_COLUMN_TITLE,
  EmptyState,
  ErrorState,
  FilterBar,
  filterAllPlaceholder,
  Icon,
  NoFilterResults,
  SectionSkeleton,
  SELECT_POPUP_PROPS,
  StatusTag,
} from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, spacing } from '@/styles/tokens'
import type { CatalogEntry } from '../types'

/** Wording for one catalog, e.g. skills or liturgical seasons. */
export interface CatalogLabels {
  /** Lower-case noun used in sentences, e.g. "kỹ năng", "mùa phụng vụ". */
  noun: string
  nameColumn: string
  addLabel: string
  emptyTitle: string
  emptyDescription: string
  errorTitle: string
}

export interface CatalogTableProps<T extends CatalogEntry> {
  labels: CatalogLabels
  /** Columns between the name and the status, e.g. the description or the season dates. */
  columns: TableColumnsType<T>
  items?: T[]
  loading?: boolean
  error?: boolean
  errorDetail?: Error | null
  retrying?: boolean
  onRetry: () => void
  onAdd: () => void
  onEdit: (item: T) => void
}

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColumn = {
  key: 'status',
  title: 'Trạng thái',
  dataIndex: 'isActive',
  width: 130,
  // Pinned with the actions: the status and the way to change it stay in view when the table scrolls sideways.
  fixed: 'right' as const,
  render: (isActive: boolean) => (
    <StatusTag color={isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
      {isActive ? 'Đang dùng' : 'Ngừng dùng'}
    </StatusTag>
  ),
}

/**
 * Searchable list of catalog entries with add/edit actions. Entries are switched off from the edit form, never
 * deleted (Harmonia-BE LookupService).
 */
export function CatalogTable<T extends CatalogEntry>({
  labels,
  columns,
  items,
  loading = false,
  error = false,
  errorDetail,
  retrying = false,
  onRetry,
  onAdd,
  onEdit,
}: Readonly<CatalogTableProps<T>>) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<boolean>()
  const visible = useMemo(
    () =>
      (items ?? []).filter(
        (item) =>
          (activeFilter === undefined || item.isActive === activeFilter) &&
          matchesSearch(search, item.name, item.description ?? undefined),
      ),
    [items, search, activeFilter],
  )
  const hasFilters = search.trim().length > 0 || activeFilter !== undefined
  const resetFilters = () => {
    setSearch('')
    setActiveFilter(undefined)
  }

  if (loading) return <SectionSkeleton rows={5} label={`Đang tải danh mục ${labels.noun}`} />
  if (error) {
    return (
      <ErrorState
        title={labels.errorTitle}
        error={errorDetail ?? undefined}
        hasData={items !== undefined}
        onRetry={onRetry}
        retrying={retrying}
      />
    )
  }
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
        action={
          <Button type="primary" icon={<Icon name="add" />} onClick={onAdd}>
            {labels.addLabel}
          </Button>
        }
      />
    )
  }

  const allColumns: TableColumnsType<T> = [
    {
      key: 'index',
      title: 'STT',
      width: 72,
      render: (_, item) => (
        <Typography.Text style={{ color: colors.textMuted }}>
          {items.indexOf(item) + 1}
        </Typography.Text>
      ),
    },
    {
      key: 'name',
      title: labels.nameColumn,
      dataIndex: 'name',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    ...columns,
    statusColumn,
    {
      key: 'actions',
      title: ACTIONS_COLUMN_TITLE,
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (_, item) => (
        <Button icon={<Icon name="edit" />} onClick={() => onEdit(item)} aria-label={`Chỉnh sửa ${item.name}`}>
          Chỉnh sửa
        </Button>
      ),
    },
  ]

  return (
    <Flex vertical gap={spacing.md}>
      <FilterBar
        resultText={hasFilters ? `${visible.length} kết quả trong ${items.length} ${labels.noun}` : `${items.length} ${labels.noun}`}
        hasActiveFilters={hasFilters}
        onReset={resetFilters}
        extra={
          <Button type="primary" icon={<Icon name="add" />} onClick={onAdd}>
            {labels.addLabel}
          </Button>
        }
      >
        <Input
          allowClear
          prefix={<Icon name="search" />}
          placeholder={`Tìm kiếm ${labels.noun}…`}
          aria-label={`Tìm kiếm ${labels.noun}`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ flex: '1 1 220px', maxWidth: 320 }}
        />
        <Select
          {...SELECT_POPUP_PROPS}
          allowClear
          aria-label={`Trạng thái ${labels.noun}`}
          placeholder={filterAllPlaceholder('trạng thái')}
          value={activeFilter}
          onChange={(value?: boolean) => setActiveFilter(value)}
          options={[
            { value: true, label: 'Đang dùng' },
            { value: false, label: 'Ngừng dùng' },
          ]}
          style={{ minWidth: 164 }}
        />
      </FilterBar>
      <Card styles={{ body: { padding: 0 } }}>
        {visible.length === 0 ? (
          <div style={{ padding: spacing.md }}>
            <NoFilterResults />
          </div>
        ) : (
          <Table<T>
            rowKey="id"
            columns={allColumns}
            dataSource={visible}
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </Flex>
  )
}
