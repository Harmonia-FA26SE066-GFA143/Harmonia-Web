import { Flex, Input, Radio, Table, Typography, type TableColumnsType } from 'antd'
import { songReviewDecisionLabels, SongReviewNote, type SongListItem, type SongReview, type SongReviewDecision } from '@/features/song-lists'
import { colors, typography } from '@/styles/tokens'

export type ReviewDraft = Record<string, Partial<SongReview>>

export interface ReviewTableProps {
  items: SongListItem[]
  /** Decisions being entered; the table is read-only when omitted. */
  draft?: ReviewDraft
  /** Item ids whose required note is missing, shown after a submit attempt. */
  missingNotes?: string[]
  onChange?: (itemId: string, review: Partial<SongReview>) => void
}

const decisions: SongReviewDecision[] = ['accepted', 'revisionRequested']
const muted = (text: string) => <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>

/** Songs of a submitted list with a per-song decision (owner decision 2026-09-28). */
export function ReviewTable({ items, draft, missingNotes = [], onChange }: ReviewTableProps) {
  const columns: TableColumnsType<SongListItem> = [
    {
      key: 'order',
      title: 'Thứ tự',
      width: 72,
      render: (_, __, index) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, color: colors.textMuted }}>
          {String(index + 1).padStart(2, '0')}
        </Typography.Text>
      ),
    },
    {
      key: 'song',
      title: 'Bài hát',
      render: (_, item) => (
        <Flex vertical>
          <Typography.Text strong>{item.title}</Typography.Text>
          {item.liturgicalPart && <Typography.Text style={{ color: colors.textMuted }}>{item.liturgicalPart}</Typography.Text>}
        </Flex>
      ),
    },
    { key: 'directorNote', title: 'Ghi chú của Ca trưởng', render: (_, item) => item.directorNote || muted('—') },
    {
      key: 'decision',
      title: 'Nhận xét',
      width: 320,
      render: (_, item) => {
        if (!draft || !onChange) return <SongReviewNote review={item.review} />
        const current = draft[item.id] ?? {}
        const noteMissing = missingNotes.includes(item.id)
        return (
          <Flex vertical gap={4}>
            <Radio.Group
              aria-label={`Quyết định cho ${item.title}`}
              value={current.decision}
              onChange={(event) => onChange(item.id, { ...current, decision: event.target.value })}
              options={decisions.map((decision) => ({ value: decision, label: songReviewDecisionLabels[decision] }))}
            />
            {current.decision === 'revisionRequested' && (
              <>
                <Input.TextArea
                  rows={2}
                  value={current.note}
                  status={noteMissing ? 'error' : undefined}
                  placeholder="Cần chỉnh sửa gì? (bắt buộc)"
                  aria-label={`Ghi chú cho ${item.title}`}
                  onChange={(event) => onChange(item.id, { ...current, note: event.target.value })}
                />
                {noteMissing && <Typography.Text type="danger">Vui lòng nhập ghi chú cho bài cần chỉnh sửa.</Typography.Text>}
              </>
            )}
          </Flex>
        )
      },
    },
  ]

  return <Table<SongListItem> rowKey="id" columns={columns} dataSource={items} pagination={false} scroll={{ x: 820 }} />
}
