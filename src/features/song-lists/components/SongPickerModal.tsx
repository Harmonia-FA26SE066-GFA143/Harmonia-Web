import { SearchOutlined } from '@ant-design/icons'
import { Checkbox, Flex, Input, Modal, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useSongs, type Song } from '@/features/music-library'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, radius, spacing, typography } from '@/styles/tokens'

export interface SongPickerModalProps {
  open: boolean
  /** Songs already in the list; they are not offered again. */
  excludedSongIds: string[]
  onAdd: (songs: Song[]) => void
  onCancel: () => void
}

/** Choose songs from the music library (FE-27) to add to a program's proposed list (FE-30). */
export function SongPickerModal({ open, excludedSongIds, onAdd, onCancel }: SongPickerModalProps) {
  const songs = useSongs()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const available = useMemo(
    () =>
      (songs.data ?? []).filter(
        (song) =>
          !excludedSongIds.includes(song.id) &&
          matchesSearch(search, song.title, song.theme, song.season?.name, song.massType?.name),
      ),
    [songs.data, excludedSongIds, search],
  )

  const close = () => {
    setSelected([])
    setSearch('')
    onCancel()
  }

  const confirm = () => {
    onAdd((songs.data ?? []).filter((song) => selected.includes(song.id)))
    setSelected([])
    setSearch('')
  }

  return (
    <Modal
      open={open}
      title="Thêm bài hát từ kho"
      okText={selected.length ? `Thêm ${selected.length} bài hát` : 'Thêm bài hát'}
      cancelText="Hủy"
      okButtonProps={{ disabled: selected.length === 0 }}
      onOk={confirm}
      onCancel={close}
      width={640}
      destroyOnHidden
    >
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo tên, chủ đề, mùa phụng vụ…"
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
        <Checkbox.Group value={selected} onChange={setSelected} style={{ width: '100%' }}>
          <Flex vertical gap={spacing.xs} style={{ width: '100%', maxHeight: 360, overflowY: 'auto' }}>
            {available.map((song) => (
              <Checkbox
                key={song.id}
                value={song.id}
                style={{ padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.md, marginInlineStart: 0 }}
              >
                <Flex vertical>
                  <Typography.Text strong>{song.title}</Typography.Text>
                  <Flex wrap gap={4}>
                    {[song.season?.name, song.massType?.name, song.theme].filter(Boolean).map((label) => (
                      <Tag key={label} style={{ marginInlineEnd: 0, fontSize: typography.metadata.fontSize }}>
                        {label}
                      </Tag>
                    ))}
                  </Flex>
                </Flex>
              </Checkbox>
            ))}
          </Flex>
        </Checkbox.Group>
      )}
    </Modal>
  )
}
