import { SearchOutlined } from '@ant-design/icons'
import { Checkbox, Flex, Input, Modal, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useSongs, type Song } from '@/features/music-library'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

// One page of the largest size the backend allows; a longer library is narrowed by searching.
const pickerPage = { pageNumber: 1, pageSize: 100 }

export interface SongPickerModalProps {
  open: boolean
  /** Songs already in the list; they are not offered again. */
  excludedSongIds: string[]
  onAdd: (songs: Song[]) => void
  onCancel: () => void
}

/** Choose songs from the music library (FE-27) to add to a program's proposed list (FE-30). */
export function SongPickerModal({ open, excludedSongIds, onAdd, onCancel }: SongPickerModalProps) {
  const [search, setSearch] = useState('')
  const keyword = useDebouncedValue(search)
  const songs = useSongs({ search: keyword }, pickerPage)
  // Picked songs survive a new search, which replaces the listed page.
  const [picked, setPicked] = useState<Song[]>([])

  const listed = useMemo(() => songs.data?.items ?? [], [songs.data])
  const available = useMemo(() => listed.filter((song) => !excludedSongIds.includes(song.id)), [listed, excludedSongIds])
  const more = (songs.data?.totalCount ?? 0) - listed.length

  const toggle = (ids: string[]) =>
    setPicked([
      ...picked.filter((song) => !available.some((item) => item.id === song.id)),
      ...available.filter((song) => ids.includes(song.id)),
    ])

  const reset = () => {
    setPicked([])
    setSearch('')
  }

  const close = () => {
    reset()
    onCancel()
  }

  const confirm = () => {
    onAdd(picked)
    reset()
  }

  return (
    <Modal
      open={open}
      title="Thêm bài hát từ kho"
      okText={picked.length ? `Thêm ${picked.length} bài hát` : 'Thêm bài hát'}
      cancelText="Hủy"
      okButtonProps={{ disabled: picked.length === 0 }}
      onOk={confirm}
      onCancel={close}
      width={640}
      destroyOnHidden
    >
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo tên bài hát, nhạc sĩ, người viết lời"
        aria-label="Tìm bài hát trong kho"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: spacing.md }}
      />
      {songs.isPending && <SectionSkeleton rows={4} label="Đang tải kho bài hát" />}
      {songs.isError && (
        <ErrorState title="Không thể tải kho bài hát" onRetry={() => songs.refetch()} retrying={songs.isFetching} />
      )}
      {songs.isSuccess && available.length === 0 && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
          Không có bài hát phù hợp trong kho.
        </Typography.Paragraph>
      )}
      {songs.isSuccess && available.length > 0 && (
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
      {songs.isSuccess && more > 0 && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: `${spacing.sm}px 0 0` }}>
          Còn {more} bài hát khác, hãy tìm theo tên để thu hẹp danh sách.
        </Typography.Paragraph>
      )}
    </Modal>
  )
}
