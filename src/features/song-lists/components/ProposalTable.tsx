import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import type { SongListItemInput, SongReview } from '../types'
import { SongReviewNote } from './SongReviewNote'

/** A row of the list being composed; `review` is the Priest's decision from the last round, if any. */
export interface DraftItem extends SongListItemInput {
  key: string
  review?: SongReview
}

export interface ProposalTableProps {
  items: DraftItem[]
  editable: boolean
  onChange: (items: DraftItem[]) => void
}

const muted = (text: string) => <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>

/** Ordered songs of the proposal: liturgical part and note per song, reordering and removal while editable. */
export function ProposalTable({ items, editable, onChange }: ProposalTableProps) {
  const update = (key: string, patch: Partial<DraftItem>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  const move = (index: number, offset: -1 | 1) => {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + offset, 0, moved)
    onChange(next)
  }
  const hasReviews = items.some((item) => item.review)

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
                aria-label={`Chuyển ${item.title} lên`}
              />
              <Button
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Chuyển ${item.title} xuống`}
              />
            </>
          )}
        </Flex>
      ),
    },
    { key: 'title', title: 'Bài hát', render: (_, item) => <Typography.Text strong>{item.title}</Typography.Text> },
    {
      key: 'part',
      title: 'Phần phụng vụ',
      render: (_, item) =>
        editable ? (
          <Input
            value={item.liturgicalPart}
            placeholder="Ví dụ: Ca nhập lễ"
            aria-label={`Phần phụng vụ của ${item.title}`}
            onChange={(event) => update(item.key, { liturgicalPart: event.target.value })}
          />
        ) : (
          item.liturgicalPart || muted('—')
        ),
    },
    {
      key: 'note',
      title: 'Ghi chú của Ca trưởng',
      render: (_, item) =>
        editable ? (
          <Input
            value={item.directorNote}
            placeholder="Ghi chú (không bắt buộc)"
            aria-label={`Ghi chú cho ${item.title}`}
            onChange={(event) => update(item.key, { directorNote: event.target.value })}
          />
        ) : (
          item.directorNote || muted('—')
        ),
    },
    ...(hasReviews
      ? [{ key: 'review', title: 'Nhận xét của Cha xứ / Ban phụng vụ', render: (_: unknown, item: DraftItem) => <SongReviewNote review={item.review} /> }]
      : []),
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
                aria-label={`Bỏ ${item.title} khỏi danh sách`}
              />
            ),
          },
        ]
      : []),
  ]

  return <Table<DraftItem> rowKey="key" columns={columns} dataSource={items} pagination={false} scroll={{ x: 820 }} />
}
