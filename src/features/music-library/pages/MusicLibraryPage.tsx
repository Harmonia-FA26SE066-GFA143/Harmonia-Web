import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { SongFilterBar } from '../components/SongFilterBar'
import { SongFormModal } from '../components/SongFormModal'
import { SongTable } from '../components/SongTable'
import { useSaveSong, useSongs } from '../hooks/useSongs'
import { duplicateTitleMessage, isDuplicateTitle } from '../songErrors'
import { emptySongFilters, hasActiveSongFilters } from '../songFilters'
import type { SongFilters, SongValues } from '../types'

const pageSize = 20

/** Choir Director: the choir's music library with FE-29 classification filters and song creation (FE-27–FE-29). */
export function MusicLibraryPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [filters, setFilters] = useState<SongFilters>(emptySongFilters)
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const songs = useSongs(query, { pageNumber: page, pageSize })
  const save = useSaveSong()
  const [adding, setAdding] = useState(false)
  const [titleError, setTitleError] = useState<string>()

  const total = songs.data?.totalCount ?? 0
  const filtered = hasActiveSongFilters(query)
  const changeFilters = (next: SongFilters) => {
    setFilters(next)
    setPage(1)
  }
  const resetFilters = () => changeFilters(emptySongFilters)
  const openSong = (songId: string) => navigate(generatePath(paths.director.songDetail, { songId }))
  const closeForm = () => {
    setAdding(false)
    setTitleError(undefined)
  }

  const handleAdd = (values: SongValues) => {
    setTitleError(undefined)
    save.mutate(
      { values },
      {
        onSuccess: (song) => {
          message.success('Đã thêm bài hát.')
          closeForm()
          openSong(song.id)
        },
        onError: (error) =>
          isDuplicateTitle(error) ? setTitleError(duplicateTitleMessage) : message.error('Không thể lưu bài hát. Vui lòng thử lại.'),
      },
    )
  }

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
      {songs.isSuccess && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có bài hát nào"
          description="Thêm bài hát để phân loại và tải lên bản nhạc, lời, audio mẫu và tài liệu tập luyện."
          action={addButton}
        />
      )}
      {songs.isSuccess && (total > 0 || filtered) && (
        <Card styles={{ body: { padding: 0 } }}>
          <SongFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={total} />
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <SongTable
              songs={songs.data.items}
              page={page}
              pageSize={pageSize}
              total={total}
              loading={songs.isPlaceholderData}
              onPageChange={setPage}
              onOpen={(song) => openSong(song.id)}
            />
          )}
        </Card>
      )}
      <SongFormModal
        open={adding}
        saving={save.isPending}
        titleError={titleError}
        onSubmit={handleAdd}
        onCancel={closeForm}
      />
    </>
  )
}
