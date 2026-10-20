import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Divider, Flex, Input, Select, Table, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { nameConflictMessage, useLookup, useSaveSlot } from '@/features/system-categories'
import { colors, spacing, typography } from '@/styles/tokens'

/** A row of the list being composed; the slot is chosen after the song is picked. */
export interface DraftItem {
  key: string
  songId: string
  songTitle: string
  slotId?: string
  /** Kept so a slot switched off since it was chosen still shows its name. */
  slotName?: string
  note?: string
}

export interface ProposalTableProps {
  items: DraftItem[]
  editable: boolean
  onChange: (items: DraftItem[]) => void
}

const muted = (text: string) => <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>

/**
 * Under the slot choices: the Choir Director adds a slot of their own (e.g. "Ca nguyện Đức Mẹ"), shared by every later
 * list (POST /api/lookups/liturgical-slots, open to the Choir Director since BE 2100688). It goes after the others.
 */
function NewSlot({ nextOrder, onCreated }: Readonly<{ nextOrder: number; onCreated: (id: string, name: string) => void }>) {
  const { message } = App.useApp()
  const save = useSaveSlot()
  const [name, setName] = useState('')
  const add = () => {
    const trimmed = name.trim()
    if (!trimmed || save.isPending) return
    save.mutate(
      { values: { name: trimmed, defaultOrder: nextOrder, isActive: true } },
      {
        onSuccess: (slot) => {
          setName('')
          onCreated(slot.id, slot.name)
        },
        onError: (error) => message.error(nameConflictMessage(error) ?? 'Không thể thêm phần phụng vụ. Vui lòng thử lại.'),
      },
    )
  }

  return (
    <Flex gap={spacing.xs} style={{ padding: spacing.xs }}>
      <Input
        size="small"
        value={name}
        maxLength={100}
        placeholder="Phần mới, vd Ca nguyện Đức Mẹ"
        aria-label="Tên phần phụng vụ mới"
        onChange={(event) => setName(event.target.value)}
        // The select would otherwise take the keys (Enter picks the highlighted option).
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') add()
        }}
      />
      <Button size="small" icon={<PlusOutlined />} loading={save.isPending} disabled={!name.trim()} onClick={add}>
        Thêm
      </Button>
    </Flex>
  )
}

/** Ordered songs of the proposal: a liturgical slot per song and a note, reordering and removal while editable. */
export function ProposalTable({ items, editable, onChange }: Readonly<ProposalTableProps>) {
  // Active slots, in liturgical order (DefaultOrder).
  const slots = useLookup('liturgicalSlots').data ?? []
  const nextOrder = Math.max(0, ...slots.map(({ defaultOrder = 0 }) => defaultOrder)) + 1
  const update = (key: string, patch: Partial<DraftItem>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  const move = (index: number, offset: -1 | 1) => {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + offset, 0, moved)
    onChange(next)
  }

  // A slot may hold several songs (e.g. two at Communion); the picker adds each song once, so a song never repeats in a slot.
  const slotOptions = (item: DraftItem) => {
    const options = slots.map(({ id, name }) => ({ value: id, label: name }))
    const retired = item.slotId && !slots.some(({ id }) => id === item.slotId)
    return retired ? [...options, { value: item.slotId, label: item.slotName ?? '' }] : options
  }

  const columns: TableColumnsType<DraftItem> = [
    {
      key: 'order',
      title: 'Thứ tự',
      width: editable ? 120 : 72,
      render: (_, item, index) => (
        <Flex align="center" gap={4}>
          <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, color: colors.textMuted, minWidth: 24 }}>
            {String(index + 1).padStart(2, '0')}
          </Typography.Text>
          {editable && (
            <>
              <Button
                size="small"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Chuyển ${item.songTitle} lên`}
              />
              <Button
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Chuyển ${item.songTitle} xuống`}
              />
            </>
          )}
        </Flex>
      ),
    },
    { key: 'title', title: 'Bài hát', render: (_, item) => <Typography.Text strong>{item.songTitle}</Typography.Text> },
    {
      key: 'slot',
      title: 'Phần phụng vụ',
      render: (_, item) =>
        editable ? (
          <Select
            showSearch
            optionFilterProp="label"
            value={item.slotId}
            placeholder="Chọn phần phụng vụ"
            status={item.slotId ? undefined : 'warning'}
            aria-label={`Phần phụng vụ của ${item.songTitle}`}
            options={slotOptions(item)}
            onChange={(slotId: string) => update(item.key, { slotId, slotName: slots.find(({ id }) => id === slotId)?.name })}
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: `${spacing.xs}px 0` }} />
                <NewSlot nextOrder={nextOrder} onCreated={(slotId, slotName) => update(item.key, { slotId, slotName })} />
              </>
            )}
            style={{ minWidth: 180 }}
          />
        ) : (
          item.slotName || muted('—')
        ),
    },
    {
      key: 'note',
      title: 'Ghi chú của Ca trưởng',
      render: (_, item) =>
        editable ? (
          <Input
            value={item.note}
            placeholder="Ghi chú (không bắt buộc)"
            aria-label={`Ghi chú cho ${item.songTitle}`}
            onChange={(event) => update(item.key, { note: event.target.value })}
          />
        ) : (
          item.note || muted('—')
        ),
    },
    ...(editable
      ? [
          {
            key: 'remove',
            title: 'Thao tác',
            align: 'right' as const,
            render: (_: unknown, item: DraftItem) => (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onChange(items.filter((entry) => entry.key !== item.key))}
                aria-label={`Bỏ ${item.songTitle} khỏi danh sách`}
              />
            ),
          },
        ]
      : []),
  ]

  return <Table<DraftItem> rowKey="key" columns={columns} dataSource={items} pagination={false} scroll={{ x: 820 }} />
}
