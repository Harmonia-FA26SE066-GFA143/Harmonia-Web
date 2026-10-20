import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as songsApi from '@/features/music-library/api/songsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as songListsApi from '../api/songListsApi'
import type { SongList, SongListItem } from '../types'
import { SongListProposalPage } from './SongListProposalPage'

const renderProposal = () =>
  renderPage(<SongListProposalPage />, '/director/programs/:programId/song-list', '/director/programs/p1/song-list')

const item = (id: string, songTitle: string, slotName = 'Ca nhập lễ'): SongListItem => ({
  id,
  songId: `song-${id}`,
  songTitle,
  slotId: `slot-${id}`,
  slotName,
  displayOrder: 1,
})

const songList = (fields: Partial<SongList>): SongList => ({
  id: 'l1',
  eventId: 'p1',
  version: 1,
  status: 'draft',
  items: [],
  reviews: [],
  ...fields,
})

const withList = (list: SongList | null) => vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(list)

const withLibrary = () => {
  const song = (id: string, title: string) => ({ id, title, composer: null, lyricist: null, musicalKey: null, tempo: null, notes: null })
  vi.spyOn(songsApi, 'listSongs').mockResolvedValue({
    items: [song('song-1', 'Con Bước Lên Bàn Thờ'), song('song-2', 'Lễ Vật Tâm Tình')],
    pageNumber: 1,
    pageSize: 100,
    totalCount: 2,
    totalPages: 1,
  })
}

const addFromLibrary = async (title: string) => {
  fireEvent.click(screen.getAllByRole('button', { name: /Thêm bài hát từ kho/ })[0])
  const picker = await screen.findByRole('dialog')
  fireEvent.click(await within(picker).findByRole('checkbox', { name: new RegExp(title) }))
  fireEvent.click(within(picker).getByRole('button', { name: 'Thêm 1 bài hát' }))
}

beforeEach(() => {
  vi.spyOn(programsApi, 'getProgram').mockResolvedValue({
    id: 'p1',
    eventName: 'Lễ Chúa Nhật XXVI',
    date: '2026-09-27',
    time: '08:00',
    locationName: 'Nhà thờ',
    status: 'published',
    songs: [],
  })
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([
    { id: 'slot-1', name: 'Ca nhập lễ' },
    { id: 'slot-3', name: 'Ca dâng lễ' },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SongListProposalPage', () => {
  it('shows a recoverable error when the list cannot be loaded', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockRejectedValue(new ApiError(403, undefined))
    renderProposal()

    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách bài hát' })).toBeInTheDocument()
  })

  it('composes a first list from the library, saves it and submits it', async () => {
    withList(null)
    withLibrary()
    const save = vi.spyOn(songListsApi, 'saveSongList').mockResolvedValue(songList({ id: 'l-new' }))
    const submit = vi.spyOn(songListsApi, 'submitSongList').mockResolvedValue()
    renderProposal()

    expect(await screen.findByRole('heading', { name: 'Chưa có bài hát nào trong đề xuất' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi duyệt/ })).toBeDisabled()

    await addFromLibrary('Lễ Vật Tâm Tình')
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Phần phụng vụ của Lễ Vật Tâm Tình' }))
    fireEvent.click(await screen.findByTitle('Ca dâng lễ'))
    fireEvent.click(screen.getByRole('button', { name: /Gửi duyệt/ }))
    // Ant Design gives every modal title the same id in tests, so the dialog is found by its visible title.
    const confirm = (await screen.findByText('Gửi danh sách bài hát để duyệt?')).closest('[role="dialog"]') as HTMLElement
    fireEvent.click(within(confirm).getByRole('button', { name: 'Gửi duyệt' }))

    await waitFor(() => expect(submit).toHaveBeenCalledWith('l-new'))
    expect(save).toHaveBeenCalledWith('p1', null, [{ songId: 'song-2', slotId: 'slot-3', note: undefined }])
  })

  it('lets several songs share a liturgical slot', async () => {
    const draft = songList({ items: [item('1', 'Con Bước Lên Bàn Thờ', 'Ca dâng lễ')].map((entry) => ({ ...entry, slotId: 'slot-3' })) })
    withList(draft)
    withLibrary()
    const save = vi.spyOn(songListsApi, 'saveSongList').mockResolvedValue(draft)
    renderProposal()

    await screen.findByText('Con Bước Lên Bàn Thờ')
    await addFromLibrary('Lễ Vật Tâm Tình')
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Phần phụng vụ của Lễ Vật Tâm Tình' }))
    const option = (await screen.findAllByTitle('Ca dâng lễ')).find((node) => node.classList.contains('ant-select-item-option'))
    expect(option).not.toHaveClass('ant-select-item-option-disabled')
    fireEvent.click(option as HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: /Lưu nháp/ }))

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('p1', draft, [
        { songId: 'song-1', slotId: 'slot-3', note: undefined },
        { songId: 'song-2', slotId: 'slot-3', note: undefined },
      ]),
    )
  })

  it('asks for a liturgical slot on every song before saving', async () => {
    withList(null)
    withLibrary()
    const save = vi.spyOn(songListsApi, 'saveSongList')
    renderProposal()

    await screen.findByRole('heading', { name: 'Chưa có bài hát nào trong đề xuất' })
    await addFromLibrary('Lễ Vật Tâm Tình')
    fireEvent.click(await screen.findByRole('button', { name: /Lưu nháp/ }))

    expect(await screen.findByText('Chọn phần phụng vụ cho mọi bài hát trước khi lưu.')).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('saves the items of the current draft and explains a refusal', async () => {
    const draft = songList({ items: [item('1', 'Con Bước Lên Bàn Thờ')] })
    withList(draft)
    const save = vi
      .spyOn(songListsApi, 'saveSongList')
      .mockRejectedValue(new ApiError(400, { code: 'VALIDATION_FAILED', errors: { Items: ['SONG_LIST_SLOT_DUPLICATE'] } }))
    renderProposal()

    fireEvent.change(await screen.findByRole('textbox', { name: 'Ghi chú cho Con Bước Lên Bàn Thờ' }), {
      target: { value: 'Hát 2 lần' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Lưu nháp/ }))

    expect(await screen.findByText('Một bài hát chỉ được chọn một lần trong cùng một phần phụng vụ.')).toBeInTheDocument()
    expect(save).toHaveBeenCalledWith('p1', draft, [{ songId: 'song-1', slotId: 'slot-1', note: 'Hát 2 lần' }])
  })

  it('is read-only while waiting for review', async () => {
    withList(songList({ status: 'submitted', items: [item('1', 'Con Bước Lên Bàn Thờ')] }))
    renderProposal()

    expect(await screen.findByText(/Đang chờ Cha xứ xem xét/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gửi duyệt/ })).toBeNull()
    expect(screen.queryByRole('combobox', { name: /Phần phụng vụ/ })).toBeNull()
  })

  it('is read-only after approval', async () => {
    withList(songList({ status: 'approved', items: [item('1', 'Con Bước Lên Bàn Thờ')] }))
    renderProposal()

    expect(await screen.findByText(/đã được phê duyệt/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gửi duyệt/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Thêm bài hát từ kho/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /khỏi danh sách/ })).toBeNull()
  })

  it('shows the Priest notes and allows a new version after a revision request', async () => {
    withList(
      songList({
        status: 'needsRevision',
        reviews: [{ decision: 'requestRevision', notes: 'Đổi bài dâng lễ.', reviewedAt: '2026-09-25T02:00:00Z' }],
        items: [item('1', 'Con Bước Lên Bàn Thờ'), item('2', 'Hãy Trở Về', 'Ca dâng lễ')],
      }),
    )
    renderProposal()

    expect(await screen.findByText(/Đổi bài dâng lễ/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi duyệt/ })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ Hãy Trở Về khỏi danh sách' }))
    expect(screen.queryByText('Hãy Trở Về')).toBeNull()
  })

  it('asks before leaving with unsaved changes', async () => {
    withList(songList({ status: 'rejected', items: [item('1', 'Con Bước Lên Bàn Thờ')] }))
    renderProposal()

    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ Con Bước Lên Bàn Thờ khỏi danh sách' }))
    fireEvent.click(screen.getByRole('button', { name: /Về chương trình/ }))
    expect(await screen.findByRole('dialog', { name: 'Rời khỏi trang đề xuất?' })).toBeInTheDocument()
  })
})
