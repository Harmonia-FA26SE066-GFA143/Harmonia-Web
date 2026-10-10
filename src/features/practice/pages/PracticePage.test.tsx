import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as membersApi from '@/features/members/api/membersApi'
import * as songsApi from '@/features/music-library/api/songsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as practiceApi from '../api/practiceApi'
import type { PracticeSubmission } from '../types'
import { PracticePage } from './PracticePage'

const renderPractice = () => renderPage(<PracticePage />, '/director/practice')

const submission = (fields: Partial<PracticeSubmission> = {}): PracticeSubmission => ({
  id: 'sub-1',
  assignmentId: 'as-1',
  assignmentTitle: 'Tập bè Tenor',
  assignmentDueDate: '2026-10-20T12:00:00Z',
  memberName: 'Giuse Vũ Đình Khôi',
  attemptNo: 1,
  submittedAt: '2026-10-10T02:00:00Z',
  status: 'submitted',
  durationSeconds: 95,
  audioUrl: 'https://files.example/khoi.mp3',
  feedbacks: [],
  ...fields,
})

const page = (items: PracticeSubmission[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })

beforeEach(() => {
  vi.spyOn(practiceApi, 'listUpcomingEvents').mockResolvedValue([])
  vi.spyOn(songsApi, 'listSongs').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0, totalPages: 0 })
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([
    { id: 'k-tenor', name: 'Tenor' },
    { id: 'k-bass', name: 'Bass' },
  ])
  vi.spyOn(membersApi, 'listChoirMembers').mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PracticePage', () => {
  it('shows a recoverable error when the review queue cannot be loaded', async () => {
    vi.spyOn(practiceApi, 'listSubmissions').mockRejectedValue(new ApiError(403, undefined))
    renderPractice()

    expect(await screen.findByRole('heading', { name: 'Không thể tải bản thu' })).toBeInTheDocument()
  })

  it('lists the submissions waiting for review and filters by status', async () => {
    const list = vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue(page([submission()]))
    renderPractice()

    expect(await screen.findByText('Giuse Vũ Đình Khôi')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith('submitted', { pageNumber: 1, pageSize: 20 })

    fireEvent.click(screen.getByText('Cần chỉnh sửa'))
    await waitFor(() => expect(list).toHaveBeenCalledWith('needsRevision', { pageNumber: 1, pageSize: 20 }))
  })

  it('requires a comment for "Cần chỉnh sửa" and records the review', async () => {
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue(page([submission()]))
    vi.spyOn(practiceApi, 'getSubmission').mockResolvedValue(submission())
    const review = vi.spyOn(practiceApi, 'reviewSubmission').mockResolvedValue()
    renderPractice()

    fireEvent.click(await screen.findByRole('button', { name: 'Nghe và chấm bản thu của Giuse Vũ Đình Khôi' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByLabelText('Bản thu của Giuse Vũ Đình Khôi')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByText('Cần chỉnh sửa'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu kết quả' }))
    expect(await within(dialog).findByText('Vui lòng nhập nhận xét khi cần chỉnh sửa.')).toBeInTheDocument()
    expect(review).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nhận xét' }), { target: { value: ' Giữ nhịp ổn định hơn. ' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu kết quả' }))
    await waitFor(() =>
      expect(review).toHaveBeenCalledWith('sub-1', { result: 'needsRevision', comment: 'Giữ nhịp ổn định hơn.' }),
    )
  })

  it('adds a comment to a reviewed submission without changing its result', async () => {
    const reviewed = submission({
      status: 'needsRevision',
      feedbacks: [
        { id: 'f1', result: 'needsRevision', comment: 'Lên cao hơn ở điệp khúc.', reviewerName: 'Ca trưởng', reviewedAt: '2026-10-10T03:00:00Z' },
      ],
    })
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue(page([reviewed]))
    vi.spyOn(practiceApi, 'getSubmission').mockResolvedValue(reviewed)
    const comment = vi.spyOn(practiceApi, 'commentSubmission').mockResolvedValue()
    renderPractice()

    fireEvent.click(await screen.findByRole('button', { name: 'Xem và nhận xét bản thu của Giuse Vũ Đình Khôi' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Lên cao hơn ở điệp khúc.')).toBeInTheDocument()
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Nhận xét' }), { target: { value: 'Nghe thêm bản mẫu.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gửi nhận xét' }))

    await waitFor(() => expect(comment).toHaveBeenCalledWith('sub-1', { comment: 'Nghe thêm bản mẫu.', result: undefined }))
  })

  it('asks for the skills of a skill-group assignment before giving it', async () => {
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue(page([]))
    const create = vi.spyOn(practiceApi, 'createAssignment')
    renderPractice()

    fireEvent.click(screen.getByRole('tab', { name: 'Giao bài' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Tiêu đề' }), { target: { value: 'Tập bè Tenor' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Theo kỹ năng' }))
    expect(await screen.findByRole('combobox', { name: 'Kỹ năng' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))

    expect(await screen.findByText('Vui lòng chọn hạn nộp.')).toBeInTheDocument()
    expect(await screen.findByText('Chọn ít nhất một kỹ năng.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('shows the readiness of each member for the chosen upcoming event', async () => {
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue(page([]))
    vi.spyOn(practiceApi, 'listUpcomingEvents').mockResolvedValue([
      { id: 'ev-1', eventDate: '2026-10-18', time: '08:00:00', title: 'Lễ Chúa Nhật', locationName: 'Nhà thờ chính' },
    ])
    const progress = vi.spyOn(practiceApi, 'listPreparationProgress').mockResolvedValue([
      {
        memberId: 'm1',
        fullName: 'Maria Trần Thị Lan',
        participationStatus: 'confirmed',
        rehearsalsHeld: 3,
        rehearsalsAttended: 2,
        assignmentsTotal: 0,
        assignmentsPassed: 0,
        assignmentsOverdue: 0,
      },
    ])
    renderPractice()

    fireEvent.click(screen.getByRole('tab', { name: 'Tiến độ' }))
    expect(await screen.findByText('Chọn một sự kiện')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sự kiện' }))
    fireEvent.click(await screen.findByTitle('Lễ Chúa Nhật · 18/10/2026 08:00 · Nhà thờ chính'))

    expect(await screen.findByText('Maria Trần Thị Lan')).toBeInTheDocument()
    expect(progress).toHaveBeenCalledWith('ev-1')
    expect(screen.getByText('Xác nhận')).toBeInTheDocument()
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })
})
