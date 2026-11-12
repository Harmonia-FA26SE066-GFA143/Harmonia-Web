import { PlusOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, useLocation, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { requestFailureMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptySongbook, EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { useNextProgram } from '@/features/liturgical-programs'
import { useSongList } from '@/features/song-lists'
import { useCatalogOptions } from '@/features/system-categories'
import { LibraryRail } from '../components/LibraryRail'
import { NextMassSongs } from '../components/NextMassSongs'
import { SongCardGrid } from '../components/SongCardGrid'
import { SongFilterBar } from '../components/SongFilterBar'
import { SongFormDrawer } from '../components/SongFormDrawer'
import { SongIndexList } from '../components/SongIndexList'
import { SongTable } from '../components/SongTable'
import {
  getStoredDensityMode,
  getStoredViewMode,
  setStoredDensityMode,
  setStoredViewMode,
  type DensityMode,
  type ViewMode,
} from '../components/viewStorage'
import { SongQuickLook } from '../components/SongQuickLook'
import { ViewSwitcher } from '../components/ViewSwitcher'
import { useSaveSong, useSongs } from '../hooks/useSongs'
import { duplicateTitleMessage, isDuplicateTitle } from '../songErrors'
import { emptySongFilters, hasActiveSongFilters, readSongListState, songListState, writeSongListState } from '../songFilters'
import type { Song, SongFilters, SongValues } from '../types'

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
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode)
  const [density, setDensity] = useState<DensityMode>(getStoredDensityMode)

  const handleViewChange = (nextView: ViewMode) => {
    setViewMode(nextView)
    setStoredViewMode(nextView)
  }

  const handleDensityChange = (nextDensity: DensityMode) => {
    setDensity(nextDensity)
    setStoredDensityMode(nextDensity)
  }

  const total = songs.data?.totalCount ?? 0
  const [selectedId, setSelectedId] = useState<string>()
  const items = songs.data?.items ?? []
  // The picked card, else the first one of the page.
  const selectedIndex = Math.max(0, items.findIndex((song) => song.id === selectedId))
  const selected = items[selectedIndex] as Song | undefined
  const showPeek = viewMode === 'grid' && total > 0
  const nextProgram = useNextProgram()
  const nextList = useSongList(nextProgram?.id ?? '', { enabled: Boolean(nextProgram) })
  const slotName = useCatalogOptions('liturgicalSlots').find((option) => option.value === filters.slotId)?.label
  const nextParts = new Map((nextList.data?.items ?? []).map((item) => [item.songId, item.slotName]))
  // SongDto has no Mass part: only the slot filter or the next Mass's list can name one.
  const partOf = (song: Song) => (slotName ? String(slotName) : nextParts.get(song.id))
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
        description="Tìm bài hát theo mùa phụng vụ, phần lễ và chủ đề; mở bản nhạc, lời ca và tài liệu tập luyện."
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Kho bài hát' }]}
        extra={addButton}
      />
      <SongFilterBar
        libraryLayout
        value={filters}
        onChange={changeFilters}
        onReset={resetFilters}
        resultCount={songs.data?.totalCount}
        extra={
          total > 0 ? (
            <ViewSwitcher view={viewMode} density={density} onViewChange={handleViewChange} onDensityChange={handleDensityChange} />
          ) : undefined
        }
      />
      <div className={`song-layout${showPeek ? ' has-peek' : ''}`}>
        <LibraryRail value={filters} onChange={changeFilters} />
        <div className="song-layout__main">
          {nextProgram && <NextMassSongs program={nextProgram} list={nextList.data} />}
          {songs.isPending && <SectionSkeleton rows={8} label="Đang tải kho bài hát" />}
          {songs.isError && (
            <ErrorState title="Không thể tải kho bài hát" error={songs.error} hasData={songs.data !== undefined} onRetry={() => songs.refetch()} retrying={songs.isFetching} />
          )}
          {songs.data !== undefined && total === 0 && !filtered && (
            <EmptyState icon={<EmptySongbook />} title="Chưa có bài hát nào" description="Thêm bài hát để bắt đầu quản lý kho nhạc." action={addButton} />
          )}
          {songs.data !== undefined && total === 0 && filtered && <NoFilterResults onClearFilters={resetFilters} />}
          {songs.data !== undefined && total > 0 && viewMode === 'grid' && (
            <SongCardGrid
              songs={songs.data.items}
              page={page}
              pageSize={pageSize}
              total={total}
              loading={songs.isPlaceholderData}
              selectedId={selected?.id}
              partOf={partOf}
              animationKey={searchParams.toString()}
              onSelect={(song) => setSelectedId(song.id)}
              onPageChange={setPage}
            />
          )}
          {songs.data !== undefined && total > 0 && viewMode !== 'grid' && (
            <div className="song-layout__sheet">
              {viewMode === 'table' ? (
                <SongTable songs={songs.data.items} page={page} pageSize={pageSize} total={total} density={density} loading={songs.isPlaceholderData} onPageChange={setPage} />
              ) : (
                <SongIndexList songs={songs.data.items} page={page} pageSize={pageSize} total={total} density={density} loading={songs.isPlaceholderData} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>
        {showPeek && selected && (
          <SongQuickLook song={selected} number={(page - 1) * pageSize + selectedIndex + 1} part={partOf(selected)} />
        )}
      </div>
      <SongFormDrawer
        open={adding}
        saving={save.isPending}
        titleError={titleError}
        onSubmit={handleAdd}
        onCancel={closeForm}
      />
    </>
  )
}
