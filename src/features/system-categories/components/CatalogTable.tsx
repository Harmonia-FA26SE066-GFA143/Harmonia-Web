import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Input, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, spacing, typography } from '@/styles/tokens'
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
  retrying?: boolean
  onRetry: () => void
  onAdd: () => void
  onEdit: (item: T) => void
}

// Semantic colors keep Ant Design defaults (no approved values yet); the label always carries the meaning.
const statusColumn = {
  key: 'status',
  title: 'Trạng thái',
  dataIndex: 'isActive',
  render: (isActive: boolean) => (
    <Tag color={isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
      {isActive ? 'Đang dùng' : 'Ngừng dùng'}
    </Tag>
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
  retrying = false,
  onRetry,
  onAdd,
  onEdit,
}: CatalogTableProps<T>) {
  const [search, setSearch] = useState('')
  const visible = useMemo(
    () => (items ?? []).filter((item) => matchesSearch(search, item.name, item.description ?? undefined)),
    [items, search],
  )

  if (loading) return <SectionSkeleton rows={5} label={`Đang tải danh mục ${labels.noun}`} />
  if (error) return <ErrorState title={labels.errorTitle} onRetry={onRetry} retrying={retrying} />
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
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
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, color: colors.textMuted }}>
          {String(items.indexOf(item) + 1).padStart(2, '0')}
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
      title: 'Thao tác',
      align: 'right',
      width: 140,
      render: (_, item) => (
        <Button icon={<EditOutlined />} onClick={() => onEdit(item)} aria-label={`Chỉnh sửa ${item.name}`}>
          Chỉnh sửa
        </Button>
      ),
    },
  ]

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <Flex wrap justify="space-between" align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
        <Input
          allowClear
          prefix={<SearchOutlined aria-hidden />}
          placeholder={`Tìm kiếm ${labels.noun}…`}
          aria-label={`Tìm kiếm ${labels.noun}`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ flex: '1 1 240px', maxWidth: 360 }}
        />
        <Flex align="center" gap={spacing.md} wrap>
          <Typography.Text style={{ color: colors.textMuted }}>
            {visible.length}/{items.length} {labels.noun}
          </Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            {labels.addLabel}
          </Button>
        </Flex>
      </Flex>
      {visible.length === 0 ? (
        <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
          <NoFilterResults onClearFilters={() => setSearch('')} />
        </div>
      ) : (
        <Table<T>
          rowKey="id"
          columns={allColumns}
          dataSource={visible}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 'max-content' }}
        />
      )}
    </Card>
  )
}
