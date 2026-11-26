import { Button, Checkbox, Flex, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { hasActiveSongFilters, SongFilterBar, useSongs, type Song, type SongFilters } from '@/features/music-library'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { ErrorState, FormDrawer, Icon, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { colors, component, spacing, typography } from '@/styles/tokens'

// One page of the largest size the backend allows; a longer library is narrowed by searching and filtering.
const pickerPage = { pageNumber: 1, pageSize: 100 }

export interface SongPickerDrawerProps {
  /** Songs already in the list: marked, and still offered, since another part of the Mass may take the same song. */
  listedSongIds: string[]
  /** The event's own classification, offered as a one-click filter; the picker opens on the whole library (G3-14). */
  suggestedFilters: SongFilters
  onAdd: (songs: Song[]) => void
  onCancel: () => void
}

/**
 * Choose songs from the music library (FE-27) to add to a program's proposed list (FE-30), searched and filtered by the
 * FE-29 classification. Mounted only while open, so each opening starts on the whole library with nothing picked: songs
 * not yet classified would vanish under the event's filters, so those are applied only when the Director asks.
 */
export function SongPickerDrawer({ listedSongIds, suggestedFilters, onAdd, onCancel }: Readonly<SongPickerDrawerProps>) {
  const [filters, setFilters] = useState<SongFilters>({ search: '' })
  const canSuggest = hasActiveSongFilters(suggestedFilters)
  const suggestionApplied =
    canSuggest &&
    filters.seasonId === suggestedFilters.seasonId &&
    filters.massTypeId === suggestedFilters.massTypeId &&
    filters.ceremonyTypeId === suggestedFilters.ceremonyTypeId
  const keyword = useDebouncedValue(filters.search)
  const songs = useSongs({ ...filters, search: keyword }, pickerPage)
  // Picked songs survive a new search, which replaces the listed page.
  const [picked, setPicked] = useState<Song[]>([])

  const listed = useMemo(() => songs.data?.items ?? [], [songs.data])
  const available = listed
  const more = (songs.data?.totalCount ?? 0) - listed.length
  const clearFilters = () => setFilters({ search: '' })

  const toggle = (ids: string[]) =>
    setPicked([
      ...picked.filter((song) => !available.some((item) => item.id === song.id)),
      ...available.filter((song) => ids.includes(song.id)),
    ])

  return (
    <FormDrawer
      open
      title="Thêm bài hát từ kho"
      okText={picked.length ? `Thêm ${picked.length} bài hát` : 'Thêm bài hát'}
      cancelText="Hủy"
      okButtonProps={{ disabled: picked.length === 0 }}
      onOk={() => onAdd(picked)}
      onCancel={onCancel}
      size={component.drawer.lg}
    >
      <Flex vertical gap={spacing.md}>
        {canSuggest && (
          <Flex wrap align="center" gap={spacing.sm}>
            {suggestionApplied ? (
              <Typography.Text style={{ color: colors.textMuted }}>Đang lọc theo mùa và loại lễ của chương trình.</Typography.Text>
            ) : (
              <Button icon={<Icon name="filter" />} onClick={() => setFilters({ ...filters, ...suggestedFilters, search: filters.search })}>
                Áp dụng gợi ý mùa & loại lễ
              </Button>
            )}
          </Flex>
        )}
        <SongFilterBar
          value={filters}
          onChange={setFilters}
          onReset={clearFilters}
          resultCount={songs.data?.totalCount}
          error={songs.isError}
        />
        {picked.length > 0 && (
          <div className="hm-picked-strip" aria-label="Các bài hát đã chọn">
            <Typography.Text strong style={{ fontSize: typography.metadata.fontSize }}>
              Đã chọn ({picked.length}):
            </Typography.Text>
            {picked.map((song) => (
              <Tag
                key={song.id}
                closable
                style={{ marginInlineEnd: 0 }}
                onClose={(event) => {
                  event.preventDefault()
                  setPicked(picked.filter((item) => item.id !== song.id))
                }}
              >
                {song.title}
              </Tag>
            ))}
            {picked.length > 1 && (
              <Button size="small" type="link" style={{ paddingInline: 4, marginInlineStart: 'auto' }} onClick={() => setPicked([])}>
                Bỏ chọn hết
              </Button>
            )}
          </div>
        )}
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
          <Checkbox.Group value={picked.map((song) => song.id)} onChange={toggle} className="hm-choice-list">
            {available.map((song) => {
              const details = [song.composer, song.musicalKey && `Giọng ${song.musicalKey}`, song.tempo].filter(Boolean).join(' · ')
              return (
                <Checkbox key={song.id} value={song.id} className="hm-choice-card">
                  <Flex vertical gap={2}>
                    <Typography.Text strong>
                      {song.title}
                      {listedSongIds.includes(song.id) && (
                        <Typography.Text style={{ color: colors.textMuted, fontWeight: 400, fontSize: typography.metadata.fontSize }}> · đã có trong danh sách</Typography.Text>
                      )}
                    </Typography.Text>
                    {details && (
                      <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                        {details}
                      </Typography.Text>
                    )}
                  </Flex>
                </Checkbox>
              )
            })}
          </Checkbox.Group>
        )}
        {songs.data !== undefined && more > 0 && (
          <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
            Còn {more} bài hát khác, hãy tìm theo tên hoặc lọc để thu hẹp danh sách.
          </Typography.Paragraph>
        )}
      </Flex>
    </FormDrawer>
  )
}
