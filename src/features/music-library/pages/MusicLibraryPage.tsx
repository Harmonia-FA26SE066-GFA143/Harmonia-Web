import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { SongFilterBar } from '../components/SongFilterBar'
import { SongFormModal } from '../components/SongFormModal'
import { SongTable } from '../components/SongTable'
import { useSaveSong, useSongs } from '../hooks/useSongs'
import { distinctValues, emptySongFilters, filterSongs } from '../songFilters'
import type { SongFilters, SongValues } from '../types'

/** Choir Director: the choir's music library with FE-29 classification filters and song creation (FE-27–FE-29). */
export function MusicLibraryPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const songs = useSongs()
  const save = useSaveSong()
  const [filters, setFilters] = useState<SongFilters>(emptySongFilters)
  const [adding, setAdding] = useState(false)

  const all = useMemo(() => songs.data ?? [], [songs.data])
  const visible = useMemo(() => filterSongs(all, filters), [all, filters])
  const suggestions = useMemo(
    () => ({
      theme: distinctValues(all, 'theme'),
      vocalRequirements: distinctValues(all, 'vocalRequirements'),
      instrumentRequirements: distinctValues(all, 'instrumentRequirements'),
    }),
    [all],
  )
  const resetFilters = () => setFilters(emptySongFilters)
  const openSong = (songId: string) => navigate(generatePath(paths.director.songDetail, { songId }))

  const handleAdd = (values: SongValues) =>
    save.mutate(
      { values },
      {
        onSuccess: (song) => {
          message.success('Đã thêm bài hát.')
          setAdding(false)
          openSong(song.id)
        },
        onError: () => message.error('Không thể lưu bài hát. Vui lòng thử lại.'),
      },
    )

  const addButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>
      Thêm bài hát
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Kho bài hát"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Kho bài hát' }]}
        description="Quản lý bài hát của ca đoàn và tìm bài theo phân loại phụng vụ."
        extra={addButton}
      />
      {songs.isPending && <SectionSkeleton rows={8} label="Đang tải kho bài hát" />}
      {songs.isError && (
        <ErrorState title="Không thể tải kho bài hát" onRetry={() => songs.refetch()} retrying={songs.isFetching} />
      )}
      {songs.isSuccess && all.length === 0 && (
        <EmptyState
          title="Chưa có bài hát nào"
          description="Thêm bài hát để phân loại và tải lên bản nhạc, lời, audio mẫu và tài liệu tập luyện."
          action={addButton}
        />
      )}
      {songs.isSuccess && all.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <SongFilterBar
            value={filters}
            onChange={setFilters}
            onReset={resetFilters}
            resultCount={visible.length}
            themes={suggestions.theme}
            vocalRequirements={suggestions.vocalRequirements}
            instrumentRequirements={suggestions.instrumentRequirements}
          />
          {visible.length === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <SongTable songs={visible} onOpen={(song) => openSong(song.id)} />
          )}
        </Card>
      )}
      <SongFormModal
        open={adding}
        suggestions={suggestions}
        saving={save.isPending}
        onSubmit={handleAdd}
        onCancel={() => setAdding(false)}
      />
    </>
  )
}
