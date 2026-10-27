import { Checkbox, Flex, Select, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useLookup } from '@/features/system-categories'
import { EmptyState, ErrorState, FormDrawer, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { useSongSuggestions } from '../hooks/useSongList'
import type { SongSuggestion } from '../types'

export interface SongSuggestionDrawerProps {
  programId: string
  /** Songs already in each slot of the list (slot id → song ids); a song appears once per slot. */
  takenBySlot: Map<string, Set<string>>
  onAdd: (slot: { id: string; name: string }, songs: SongSuggestion[]) => void
  onCancel: () => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** "Chưa hát lần nào" or "Đã hát 3 lần, gần nhất 27/09/2026": the Director weighs a familiar song against a fresh one. */
const usageText = ({ timesUsed, lastUsedDate }: SongSuggestion) =>
  timesUsed === 0 || !lastUsedDate
    ? 'Chưa hát lần nào'
    : `Đã hát ${timesUsed} lần, gần nhất ${dayjs(lastUsedDate).format('DD/MM/YYYY')}`

const reasons = (song: SongSuggestion) =>
  [song.matchesSlot && 'Đúng phần phụng vụ', song.matchesEventType && 'Đúng loại lễ', song.matchesSeason && 'Đúng mùa'].filter(
    (reason): reason is string => Boolean(reason),
  )

/**
 * Songs the backend proposes for one part of the program (BE d1ca63e), with why they fit and how recently the choir
 * sang them; the chosen ones join the list in that part. Mounted only while open, so each opening starts afresh.
 */
export function SongSuggestionDrawer({ programId, takenBySlot, onAdd, onCancel }: Readonly<SongSuggestionDrawerProps>) {
  const slots = useLookup('liturgicalSlots').data ?? []
  const [chosen, setChosen] = useState<string>()
  // Until the Director picks one: the first part of the Mass with no song yet.
  const slotId = chosen ?? (slots.find(({ id }) => !takenBySlot.get(id)?.size) ?? slots[0])?.id
  const [picked, setPicked] = useState<string[]>([])
  const suggestions = useSongSuggestions(programId, slotId)
  const slot = slots.find(({ id }) => id === slotId)
  const taken = (slotId && takenBySlot.get(slotId)) || new Set<string>()
  const available = (suggestions.data?.items ?? []).filter((song) => !taken.has(song.songId))
  const more = (suggestions.data?.totalCount ?? 0) - (suggestions.data?.items.length ?? 0)

  return (
    <FormDrawer
      open
      title="Gợi ý bài hát"
      okText={picked.length && slot ? `Thêm ${picked.length} bài vào ${slot.name}` : 'Thêm bài hát'}
      cancelText="Hủy"
      okButtonProps={{ disabled: picked.length === 0 || !slot }}
      onOk={() => slot && onAdd(slot, available.filter((song) => picked.includes(song.songId)))}
      onCancel={onCancel}
      size={760}
    >
      <Flex vertical gap={spacing.md}>
        <Flex vertical gap={4}>
          <label htmlFor="suggestion-slot" style={muted}>
            Phần phụng vụ
          </label>
          <Select
            id="suggestion-slot"
            showSearch
            optionFilterProp="label"
            placeholder="Chọn phần phụng vụ"
            value={slotId}
            onChange={(next: string) => {
              setChosen(next)
              setPicked([])
            }}
            options={slots.map(({ id, name }) => ({ value: id, label: name }))}
            style={{ maxWidth: 320 }}
          />
          <Typography.Text style={muted}>
            Bài khớp phần phụng vụ, loại lễ và mùa của chương trình lên trước; cùng mức thì bài để trống ít phân loại hơn, rồi bài
            lâu chưa hát.
          </Typography.Text>
        </Flex>
        {suggestions.isPending && slotId && <SectionSkeleton rows={4} label="Đang tải gợi ý" />}
        {suggestions.isError && (
          <ErrorState
            headingLevel={3}
            title="Không thể tải gợi ý"
            error={suggestions.error}
            hasData={suggestions.data !== undefined}
            onRetry={() => suggestions.refetch()}
            retrying={suggestions.isFetching}
          />
        )}
        {suggestions.data !== undefined && available.length === 0 && (
          <EmptyState
            headingLevel={3}
            title="Chưa có bài gợi ý cho phần này"
            description="Gợi ý dựa trên phân loại của bài hát (mùa, loại lễ, phần phụng vụ). Phân loại thêm bài trong Kho bài hát, hoặc thêm bài từ kho."
          />
        )}
        {available.length > 0 && (
          <Checkbox.Group value={picked} onChange={setPicked} style={{ width: '100%' }}>
            <Flex vertical gap={spacing.xs} style={{ width: '100%', maxHeight: 380, overflowY: 'auto' }}>
              {available.map((song) => (
                <Checkbox
                  key={song.songId}
                  value={song.songId}
                  style={{ padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.md, marginInlineStart: 0 }}
                >
                  <Flex vertical gap={2}>
                    <Typography.Text strong>{song.title}</Typography.Text>
                    {song.composer && <Typography.Text style={muted}>{song.composer}</Typography.Text>}
                    <Flex wrap align="center" gap={4}>
                      {reasons(song).map((reason) => (
                        <Tag key={reason} color="green" style={{ marginInlineEnd: 0 }}>
                          {reason}
                        </Tag>
                      ))}
                      <Typography.Text style={muted}>· {usageText(song)}</Typography.Text>
                    </Flex>
                  </Flex>
                </Checkbox>
              ))}
            </Flex>
          </Checkbox.Group>
        )}
        {more > 0 && (
          <Typography.Text style={muted}>Còn {more} bài gợi ý khác; thêm bài từ kho để tìm theo tên.</Typography.Text>
        )}
      </Flex>
    </FormDrawer>
  )
}
