import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, useLocation, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { requestFailureMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { SongFilterBar } from '../components/SongFilterBar'
import { SongFormModal } from '../components/SongFormModal'
import { SongGrid } from '../components/SongGrid'
import { useSaveSong, useSongs } from '../hooks/useSongs'
import { duplicateTitleMessage, isDuplicateTitle } from '../songErrors'
import { emptySongFilters, hasActiveSongFilters, readSongListState, songListState, writeSongListState } from '../songFilters'
import type { SongFilters, SongValues } from '../types'

// Divisible by 2, 3 and 4: the card grid ends on a full row at every width.
const pageSize = 24

/** Choir Director: the choir's music library with FE-29 classification filters and song creation (FE-27–FE-29). */
export function MusicLibraryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, page } = useMemo(() => readSongListState(searchParams), [searchParams])
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const songs = useSongs(query, { pageNumber: page, pageSize })
  const save = useSaveSong()
  const [adding, setAdding] = useState(false)
  const [titleError, setTitleError] = useState<string>()

  const total = songs.data?.totalCount ?? 0
  const filtered = hasActiveSongFilters(query)
  // `replace`: typing in the search box must not fill the history; Back leaves the list instead.
  const changeFilters = (next: SongFilters) => setSearchParams(writeSongListState(next, 1), { replace: true })
  const setPage = (next: number) => setSearchParams(writeSongListState(filters, next), { replace: true })
  const resetFilters = () => changeFilters(emptySongFilters)
  const openSong = (songId: string) =>
    navigate(generatePath(paths.director.songDetail, { songId }), { state: songListState(location.search) })
  const closeForm = () => {
    setAdding(false)
    setTitleError(undefined)
  }

  const handleAdd = (values: SongValues) => {
    if (save.isPending) return
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
          isDuplicateTitle(error)
            ? setTitleError(duplicateTitleMessage)
            : message.error(requestFailureMessage(error, 'Không thể lưu bài hát. Vui lòng thử lại.')),
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
        description="Bài hát của ca đoàn cùng bản nhạc, lời và audio mẫu; tìm bài theo phân loại phụng vụ."
        extra={addButton}
      />
      {songs.isPending && <SectionSkeleton rows={8} label="Đang tải kho bài hát" />}
      {songs.isError && (
        <ErrorState title="Không thể tải kho bài hát" error={songs.error} hasData={songs.data !== undefined} onRetry={() => songs.refetch()} retrying={songs.isFetching} />
      )}
      {songs.data !== undefined && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có bài hát nào"
          description="Thêm bài hát để phân loại và tải lên bản nhạc, lời, audio mẫu và tài liệu tập luyện."
          action={addButton}
        />
      )}
      {songs.data !== undefined && (total > 0 || filtered) && (
        <Card styles={{ body: { padding: 0 } }}>
          <SongFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={total} />
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <SongGrid
              songs={songs.data.items}
              page={page}
              pageSize={pageSize}
              total={total}
              loading={songs.isPlaceholderData}
              onPageChange={setPage}
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
