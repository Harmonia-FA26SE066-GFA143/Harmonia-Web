import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as eventsApi from '@/features/liturgical-programs/api/eventsApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as songsApi from '@/features/music-library/api/songsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { renderPage } from '@/test/renderPage'
import * as reviewApi from '../api/songListReviewApi'
import type { SongList } from '../types'
import { SongListReviewPage } from './SongListReviewPage'

const submitted: SongList = {
  id: 'sl-2',
  eventId: 'e1',
  version: 2,
  status: 'submitted',
  submittedAt: '2026-10-09T02:00:00Z',
  items: [
    { id: 'i1', songId: 's1', songTitle: 'Con Bước Lên Bàn Thờ', slotName: 'Ca nhập lễ', displayOrder: 1, note: 'Toàn ca đoàn hát.' },
    { id: 'i2', songId: 's2', songTitle: 'Lễ Vật Tâm Tình', slotName: 'Ca dâng lễ', displayOrder: 2 },
  ],
  reviews: [],
}

const renderReview = () =>
  renderPage(<SongListReviewPage />, '/priest/programs/:programId/song-review', '/priest/programs/e1/song-review')

const confirmDialog = async (title: string) =>
  (await screen.findAllByText(title))[0].closest('.ant-modal') as HTMLElement

beforeEach(() => {
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([])
  vi.spyOn(programsApi, 'getSongCredits').mockResolvedValue({ composer: 'Kim Long', materials: 2 })
  vi.spyOn(eventsApi, 'getPreparationStatus').mockResolvedValue({
    participation: { invited: 0, confirmed: 0, declined: 0, unsure: 0 },
    rosterActiveAssignments: 0,
    rehearsalsTotal: 0,
    rehearsalsHeld: 0,
    attendanceExpected: 0,
    attendancePresent: 0,
    practiceExpected: 0,
    practicePassed: 0,
    practiceOverdue: 0,
  })
  vi.spyOn(eventsApi, 'getEvent').mockResolvedValue({
    id: 'e1',
    date: '2099-10-18',
    time: '08:00',
    title: 'Lễ Chúa Nhật XXIX',
    locationId: 'loc-1',
    locationName: 'Nhà thờ chính',
    status: 'published',
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SongListReviewPage', () => {
  it('explains when the event has no list yet', async () => {
    const latest = vi.spyOn(reviewApi, 'getLatestSongList').mockResolvedValue(null)
    renderReview()

    expect(await screen.findByRole('heading', { name: 'Chưa có danh sách bài hát' })).toBeInTheDocument()
    expect(latest).toHaveBeenCalledWith('e1')
  })

  it("opens a song's materials read-only, so the Priest can judge it before deciding", async () => {
    vi.spyOn(reviewApi, 'getLatestSongList').mockResolvedValue(submitted)
    const materials = vi.spyOn(songsApi, 'listMaterials').mockResolvedValue([
      {
        id: 'm1',
        kind: 'lyrics',
        title: 'Lời bài hát bản in',
        fileName: 'loi.pdf',
        fileSizeBytes: 2048,
        targetSkillId: null,
        targetSkillName: null,
        url: 'https://files.example/loi.pdf',
        lyricsText: null,
        createdAt: '2026-10-01T02:00:00Z',
      },
    ])
    renderReview()

    fireEvent.click(await screen.findByRole('button', { name: 'Xem bản nhạc và tài liệu của Lễ Vật Tâm Tình' }))

    const drawer = await screen.findByRole('dialog', { name: 'Lễ Vật Tâm Tình' })
    expect(await within(drawer).findByText('Lời bài hát bản in')).toBeInTheDocument()
    expect(within(drawer).getByRole('link', { name: /Xem\/Tải xuống Lời bài hát bản in/ })).toHaveAttribute('href', 'https://files.example/loi.pdf')
    expect(within(drawer).queryByRole('button', { name: /Tải lên|Xoá|Sửa|Tiến độ học/ })).toBeNull()
    expect(materials).toHaveBeenCalledWith('s2')
  })

  it('requires a note to request a revision of the whole list, then stays on the page', async () => {
    vi.spyOn(reviewApi, 'getLatestSongList').mockResolvedValue(submitted)
    const review = vi.spyOn(reviewApi, 'reviewSongList').mockResolvedValue()
    renderReview()

    expect(await screen.findByText('Toàn ca đoàn hát.')).toBeInTheDocument()
    expect(screen.getByText(/Phiên bản 2/)).toBeInTheDocument()
    // Who wrote each song comes from the song itself (SongDto).
    await waitFor(() => expect(screen.getAllByText('Nhạc: Kim Long · 2 tài liệu đính kèm')).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu sửa' }))
    expect(await screen.findByText('Vui lòng nhập nội dung cần chỉnh sửa.')).toBeInTheDocument()
    expect(review).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('textbox', { name: 'Nhận xét gửi Ca trưởng' }), { target: { value: ' Đổi bài Ca dâng lễ. ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu sửa' }))
    const dialog = await confirmDialog('Yêu cầu Ca trưởng sửa danh sách?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi yêu cầu sửa' }))

    await waitFor(() => expect(review).toHaveBeenCalledWith('sl-2', { decision: 'requestRevision', notes: 'Đổi bài Ca dâng lễ.' }))
    expect(await screen.findByText('Đã gửi yêu cầu sửa cho Ca trưởng.')).toBeInTheDocument()
    // Still on the review page: the program heading stays, no navigation happened.
    expect(screen.queryByTestId('location')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Lễ Chúa Nhật XXIX' })).toBeInTheDocument()
  })

  it('approves without a note', async () => {
    vi.spyOn(reviewApi, 'getLatestSongList').mockResolvedValue(submitted)
    const review = vi.spyOn(reviewApi, 'reviewSongList').mockResolvedValue()
    renderReview()

    // The list is written, so the current step is the Priest's review.
    expect(await screen.findByText(/Bước 2\/6/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt' }))
    const dialog = await confirmDialog('Duyệt danh sách bài hát?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Duyệt' }))

    await waitFor(() => expect(review).toHaveBeenCalledWith('sl-2', { decision: 'approve', notes: undefined }))
  })

  it('shows the approved list read-only, with its history', async () => {
    vi.spyOn(reviewApi, 'getLatestSongList').mockResolvedValue({
      ...submitted,
      status: 'approved',
      decidedAt: '2026-10-10T02:00:00Z',
      reviews: [{ id: 'r1', decision: 'approve', notes: 'Hợp chủ đề.', reviewedAt: '2026-10-10T02:00:00Z' }],
    })
    renderReview()

    expect(await screen.findByText('Đã duyệt')).toBeInTheDocument()
    expect(screen.getByText('“Hợp chủ đề.”')).toBeInTheDocument()
    expect(screen.getByText('Lễ Vật Tâm Tình')).toBeInTheDocument()
    // Approved: steps 1 and 2 are done, so the current step is 3.
    expect(await screen.findByText(/Bước 3\/6/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Duyệt' })).toBeNull()
  })

  it('shows a list sent back for revision read-only, with the note', async () => {
    vi.spyOn(reviewApi, 'getLatestSongList').mockResolvedValue({
      ...submitted,
      status: 'needsRevision',
      decidedAt: '2026-10-10T02:00:00Z',
      reviews: [{ id: 'r1', decision: 'requestRevision', notes: 'Đổi bài Ca dâng lễ.', reviewedAt: '2026-10-10T02:00:00Z' }],
    })
    renderReview()

    expect(await screen.findByText('Đã yêu cầu chỉnh sửa')).toBeInTheDocument()
    expect(screen.getByText('“Đổi bài Ca dâng lễ.”')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yêu cầu sửa' })).toBeNull()
  })
})
