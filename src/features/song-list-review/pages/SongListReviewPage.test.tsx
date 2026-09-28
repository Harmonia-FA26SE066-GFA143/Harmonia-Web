import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import type { SongList } from '@/features/song-lists'
import { renderPage } from '@/test/renderPage'
import { SongListReviewPage } from './SongListReviewPage'

const submitted: SongList = {
  programId: 'p1',
  status: 'submitted',
  items: [
    { id: 'i1', songId: 's1', title: 'Con Bước Lên Bàn Thờ', liturgicalPart: 'Ca nhập lễ', directorNote: 'Toàn ca đoàn hát.' },
    { id: 'i2', songId: 's2', title: 'Lễ Vật Tâm Tình', liturgicalPart: 'Ca dâng lễ' },
  ],
}

const renderReview = () =>
  renderPage(<SongListReviewPage />, '/priest/programs/:programId/song-review', '/priest/programs/p1/song-review')

const decide = (title: string, label: 'Chấp thuận' | 'Cần chỉnh sửa') =>
  fireEvent.click(within(screen.getByRole('radiogroup', { name: `Quyết định cho ${title}` })).getByRole('radio', { name: label }))

beforeEach(() => {
  vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ id: 'p1', eventName: 'Lễ Chúa Nhật XXVI', date: '2026-09-27', songs: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SongListReviewPage', () => {
  it('explains when no list has been submitted', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({ programId: 'p1', items: [] })
    renderReview()

    expect(await screen.findByRole('heading', { name: 'Chưa có danh sách bài hát' })).toBeInTheDocument()
  })

  it('approves the list when every song is accepted', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(submitted)
    const review = vi.spyOn(songListsApi, 'submitSongReview').mockResolvedValue({ ...submitted, status: 'approved' })
    renderReview()

    expect(await screen.findByText('Toàn ca đoàn hát.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi quyết định' }))
    expect(await screen.findByText('Còn 2 bài hát chưa có quyết định.')).toBeInTheDocument()

    decide('Con Bước Lên Bàn Thờ', 'Chấp thuận')
    decide('Lễ Vật Tâm Tình', 'Chấp thuận')
    fireEvent.click(screen.getByRole('button', { name: 'Gửi quyết định' }))
    const confirm = await screen.findByRole('dialog', { name: 'Phê duyệt danh sách bài hát?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Phê duyệt' }))

    await waitFor(() =>
      expect(review).toHaveBeenCalledWith('p1', {
        decisions: { i1: { decision: 'accepted', note: undefined }, i2: { decision: 'accepted', note: undefined } },
        note: undefined,
      }),
    )
  })

  it('requires a note for a song that needs revision and then requests revision', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(submitted)
    const review = vi.spyOn(songListsApi, 'submitSongReview').mockResolvedValue({ ...submitted, status: 'revisionRequested' })
    renderReview()

    decide(await screen.findByText('Con Bước Lên Bàn Thờ').then(() => 'Con Bước Lên Bàn Thờ'), 'Chấp thuận')
    decide('Lễ Vật Tâm Tình', 'Cần chỉnh sửa')
    fireEvent.click(screen.getByRole('button', { name: 'Gửi quyết định' }))
    expect(await screen.findByText('Vui lòng nhập ghi chú cho bài cần chỉnh sửa.')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú cho Lễ Vật Tâm Tình' }), { target: { value: 'Đổi bài khác.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi quyết định' }))
    const confirm = await screen.findByRole('dialog', { name: 'Yêu cầu Ca trưởng chỉnh sửa?' })
    expect(within(confirm).getByText(/1\/2 bài hát cần chỉnh sửa/)).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: 'Gửi yêu cầu chỉnh sửa' }))

    await waitFor(() =>
      expect(review).toHaveBeenCalledWith('p1', expect.objectContaining({
        decisions: expect.objectContaining({ i2: { decision: 'revisionRequested', note: 'Đổi bài khác.' } }),
      })),
    )
  })

  it('requires a reason to reject the whole list', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue(submitted)
    const reject = vi.spyOn(songListsApi, 'rejectSongList').mockResolvedValue({ ...submitted, status: 'rejected' })
    renderReview()

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối toàn bộ danh sách' }))
    const dialog = await screen.findByRole('dialog', { name: 'Từ chối toàn bộ danh sách?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    expect(await within(dialog).findByText('Vui lòng nhập lý do từ chối.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Lý do từ chối' }), { target: { value: 'Chưa hợp chủ đề.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))
    await waitFor(() => expect(reject).toHaveBeenCalledWith('p1', 'Chưa hợp chủ đề.'))
  })

  it('shows past decisions read-only once the list is approved', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({
      ...submitted,
      status: 'approved',
      items: submitted.items.map((item) => ({ ...item, review: { decision: 'accepted' } })),
    })
    renderReview()

    expect(await screen.findByText(/Danh sách đã được phê duyệt/)).toBeInTheDocument()
    expect(screen.getAllByText('Chấp thuận')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Gửi quyết định' })).toBeNull()
  })
})
