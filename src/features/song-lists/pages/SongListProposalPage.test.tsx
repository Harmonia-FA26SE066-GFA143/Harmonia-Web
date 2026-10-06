import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as songsApi from '@/features/music-library/api/songsApi'
import { renderPage } from '@/test/renderPage'
import * as songListsApi from '../api/songListsApi'
import type { SongList } from '../types'
import { SongListProposalPage } from './SongListProposalPage'

const renderProposal = () =>
  renderPage(<SongListProposalPage />, '/director/programs/:programId/song-list', '/director/programs/p1/song-list')

const withList = (list: Partial<SongList>) =>
  vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({ programId: 'p1', items: [], ...list })

beforeEach(() => {
  vi.spyOn(programsApi, 'getProgram').mockResolvedValue({
    id: 'p1',
    eventName: 'Lễ Chúa Nhật XXVI',
    date: '2026-09-27',
    songs: [],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SongListProposalPage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    renderProposal()

    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách bài hát' })).toBeInTheDocument()
  })

  it('composes a list from the library and submits it', async () => {
    withList({})
    const song = (id: string, title: string) => ({ id, title, composer: null, lyricist: null, musicalKey: null, tempo: null, notes: null })
    vi.spyOn(songsApi, 'listSongs').mockResolvedValue({
      items: [song('song-1', 'Con Bước Lên Bàn Thờ'), song('song-2', 'Lễ Vật Tâm Tình')],
      pageNumber: 1,
      pageSize: 100,
      totalCount: 2,
      totalPages: 1,
    })
    const submit = vi.spyOn(songListsApi, 'submitSongList').mockResolvedValue({ programId: 'p1', status: 'submitted', items: [] })
    renderProposal()

    expect(await screen.findByRole('heading', { name: 'Chưa có bài hát nào trong đề xuất' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi duyệt/ })).toBeDisabled()

    fireEvent.click(screen.getAllByRole('button', { name: /Thêm bài hát từ kho/ })[0])
    const picker = await screen.findByRole('dialog')
    fireEvent.click(await within(picker).findByRole('checkbox', { name: /Lễ Vật Tâm Tình/ }))
    fireEvent.click(within(picker).getByRole('button', { name: 'Thêm 1 bài hát' }))

    fireEvent.change(await screen.findByRole('textbox', { name: 'Phần phụng vụ của Lễ Vật Tâm Tình' }), {
      target: { value: 'Ca dâng lễ ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Gửi duyệt/ }))
    // Ant Design gives every modal title the same id in tests, so the dialog is found by its visible title.
    const confirm = (await screen.findByText('Gửi danh sách bài hát để duyệt?')).closest('[role="dialog"]') as HTMLElement
    fireEvent.click(within(confirm).getByRole('button', { name: 'Gửi duyệt' }))

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith('p1', [
        { songId: 'song-2', title: 'Lễ Vật Tâm Tình', liturgicalPart: 'Ca dâng lễ', directorNote: undefined },
      ]),
    )
  })

  it('is read-only while waiting for review', async () => {
    withList({ status: 'submitted', items: [{ id: 'i1', songId: 'song-1', title: 'Con Bước Lên Bàn Thờ' }] })
    renderProposal()

    expect(await screen.findByText(/Đang chờ Cha xứ \/ Ban phụng vụ xem xét/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gửi duyệt/ })).toBeNull()
    expect(screen.queryByRole('textbox', { name: /Phần phụng vụ/ })).toBeNull()
  })

  it('is read-only after approval', async () => {
    withList({ status: 'approved', items: [{ id: 'i1', songId: 'song-1', title: 'Con Bước Lên Bàn Thờ', review: { decision: 'accepted' } }] })
    renderProposal()

    expect(await screen.findByText(/Danh sách đã được phê duyệt/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gửi duyệt/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Thêm bài hát từ kho/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /khỏi danh sách/ })).toBeNull()
  })

  it('shows the Priest notes and allows resubmitting after a revision request', async () => {
    withList({
      status: 'revisionRequested',
      priestNote: 'Đổi bài dâng lễ.',
      items: [
        { id: 'i1', songId: 'song-1', title: 'Con Bước Lên Bàn Thờ', review: { decision: 'accepted' } },
        { id: 'i2', songId: 'song-5', title: 'Hãy Trở Về', review: { decision: 'revisionRequested', note: 'Hợp Mùa Chay hơn.' } },
      ],
    })
    renderProposal()

    expect(await screen.findByText(/Đổi bài dâng lễ/)).toBeInTheDocument()
    expect(screen.getByText('Hợp Mùa Chay hơn.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gửi duyệt/ })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ Hãy Trở Về khỏi danh sách' }))
    expect(screen.queryByText('Hãy Trở Về')).toBeNull()
  })

  it('asks before leaving with unsent changes', async () => {
    withList({ status: 'rejected', priestNote: 'Chưa hợp chủ đề.', items: [{ id: 'i1', songId: 'song-1', title: 'Con Bước Lên Bàn Thờ' }] })
    renderProposal()

    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ Con Bước Lên Bàn Thờ khỏi danh sách' }))
    fireEvent.click(screen.getByRole('button', { name: /Về chương trình/ }))
    expect(await screen.findByRole('dialog', { name: 'Rời khỏi trang đề xuất?' })).toBeInTheDocument()
  })
})
