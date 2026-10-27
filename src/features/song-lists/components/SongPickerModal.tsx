import { Checkbox, Flex, Modal, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { hasActiveSongFilters, SongFilterBar, useSongs, type Song, type SongFilters } from '@/features/music-library'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { ErrorState, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

// One page of the largest size the backend allows; a longer library is narrowed by searching and filtering.
const pickerPage = { pageNumber: 1, pageSize: 100 }

export interface SongPickerModalProps {
  /** Songs already in the list; they are not offered again. */
  excludedSongIds: string[]
  /** The event's own classification, applied when the picker opens; the Choir Director may clear it. */
  suggestedFilters: SongFilters
  onAdd: (songs: Song[]) => void
  onCancel: () => void
}

/**
 * Choose songs from the music library (FE-27) to add to a program's proposed list (FE-30), searched and filtered by the
 * FE-29 classification. Mounted only while open, so each opening starts from the event's suggestion with nothing picked.
 */
export function SongPickerModal({ excludedSongIds, suggestedFilters, onAdd, onCancel }: Readonly<SongPickerModalProps>) {
  const [filters, setFilters] = useState(suggestedFilters)
  const keyword = useDebouncedValue(filters.search)
  const songs = useSongs({ ...filters, search: keyword }, pickerPage)
  // Picked songs survive a new search, which replaces the listed page.
  const [picked, setPicked] = useState<Song[]>([])

  const listed = useMemo(() => songs.data?.items ?? [], [songs.data])
  const available = useMemo(() => listed.filter((song) => !excludedSongIds.includes(song.id)), [listed, excludedSongIds])
  const more = (songs.data?.totalCount ?? 0) - listed.length
  const clearFilters = () => setFilters({ search: '' })

  const toggle = (ids: string[]) =>
    setPicked([
      ...picked.filter((song) => !available.some((item) => item.id === song.id)),
      ...available.filter((song) => ids.includes(song.id)),
    ])

  return (
    <Modal
      open
      title="Thêm bài hát từ kho"
      okText={picked.length ? `Thêm ${picked.length} bài hát` : 'Thêm bài hát'}
      cancelText="Hủy"
      okButtonProps={{ disabled: picked.length === 0 }}
      onOk={() => onAdd(picked)}
      onCancel={onCancel}
      width={760}
    >
      {hasActiveSongFilters(suggestedFilters) && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
          Bộ lọc được đặt sẵn theo mùa phụng vụ và loại lễ của sự kiện. Bấm “Xoá tất cả bộ lọc” để xem cả kho.
        </Typography.Paragraph>
      )}
      <SongFilterBar value={filters} onChange={setFilters} onReset={clearFilters} resultCount={songs.data?.totalCount ?? 0} />
      {songs.isPending && <SectionSkeleton rows={4} label="Đang tải kho bài hát" />}
      {songs.isError && (
        <ErrorState title="Không thể tải kho bài hát" error={songs.error} hasData={songs.data !== undefined} onRetry={() => songs.refetch()} retrying={songs.isFetching} />
      )}
      {songs.data !== undefined && available.length === 0 && hasActiveSongFilters(filters) && (
        <NoFilterResults
          title="Không có bài hát phù hợp với bộ lọc"
          description="Bài hát chưa được phân loại sẽ không hiện khi lọc theo phân loại."
          onClearFilters={clearFilters}
        />
      )}
      {songs.data !== undefined && available.length === 0 && !hasActiveSongFilters(filters) && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
          Không có bài hát phù hợp trong kho.
        </Typography.Paragraph>
      )}
      {songs.data !== undefined && available.length > 0 && (
        <Checkbox.Group value={picked.map((song) => song.id)} onChange={toggle} style={{ width: '100%' }}>
          <Flex vertical gap={spacing.xs} style={{ width: '100%', maxHeight: 360, overflowY: 'auto' }}>
            {available.map((song) => (
              <Checkbox
                key={song.id}
                value={song.id}
                style={{ padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.md, marginInlineStart: 0 }}
              >
                <Flex vertical>
                  <Typography.Text strong>{song.title}</Typography.Text>
                  {song.composer && (
                    <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                      {song.composer}
                    </Typography.Text>
                  )}
                </Flex>
              </Checkbox>
            ))}
          </Flex>
        </Checkbox.Group>
      )}
      {songs.data !== undefined && more > 0 && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: `${spacing.sm}px 0 0` }}>
          Còn {more} bài hát khác, hãy tìm theo tên hoặc lọc để thu hẹp danh sách.
        </Typography.Paragraph>
      )}
    </Modal>
  )
}
