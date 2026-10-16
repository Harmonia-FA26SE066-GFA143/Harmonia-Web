import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Table, Typography, type TableColumnsType } from 'antd'
import { useLookup } from '@/features/system-categories'
import { colors, typography } from '@/styles/tokens'

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

/** Ordered songs of the proposal: one liturgical slot per song and a note, reordering and removal while editable. */
export function ProposalTable({ items, editable, onChange }: Readonly<ProposalTableProps>) {
  // Active slots, in liturgical order (DefaultOrder).
  const slots = useLookup('liturgicalSlots').data ?? []
  const update = (key: string, patch: Partial<DraftItem>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  const move = (index: number, offset: -1 | 1) => {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + offset, 0, moved)
    onChange(next)
  }

  // Each slot holds one song of the list (SONG_LIST_SLOT_DUPLICATE), so slots taken by another row are disabled.
  const slotOptions = (item: DraftItem) => {
    const taken = new Set(items.filter((other) => other.key !== item.key).map((other) => other.slotId))
    const options = slots.map(({ id, name }) => ({ value: id, label: name, disabled: taken.has(id) }))
    const retired = item.slotId && !slots.some(({ id }) => id === item.slotId)
    return retired ? [...options, { value: item.slotId, label: item.slotName ?? '', disabled: false }] : options
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
