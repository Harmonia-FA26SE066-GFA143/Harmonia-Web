import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as participationApi from '@/features/participation/api/participationApi'
import * as songListsApi from '@/features/song-lists/api/songListsApi'
import { renderPage } from '@/test/renderPage'
import * as practiceApi from '../api/practiceApi'
import type { PracticeAssignment, PracticeSubmission } from '../types'
import { PracticePage } from './PracticePage'

const renderPractice = () => renderPage(<PracticePage />, '/director/practice', '/director/practice?programId=p1')

const assignment: PracticeAssignment = {
  id: 'a1',
  programId: 'p1',
  title: 'Luyện bè trầm',
  song: { songId: 's1', title: 'Xin Vâng' },
  dueAt: dayjs().add(3, 'day').toISOString(),
  audience: { kind: 'skills', skills: ['Bass'] },
}

const submissions: PracticeSubmission[] = [
  { id: 'a1:m1', assignmentId: 'a1', memberId: 'm1', fullName: 'Gioan B. Phạm Hữu Tài', skills: ['Bass'], status: 'submitted', submittedAt: dayjs().toISOString(), reviews: [] },
  { id: 'a1:m2', assignmentId: 'a1', memberId: 'm2', fullName: 'Simon Phan Văn Đức', skills: ['Bass'], reviews: [] },
]

const withData = () => {
  vi.spyOn(practiceApi, 'listAssignments').mockResolvedValue([assignment])
  vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue(submissions)
}

beforeEach(() => {
  vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([
    { id: 'p1', eventName: 'Thánh lễ Hôn Phối', date: dayjs().add(5, 'day').format('YYYY-MM-DD'), songListStatus: 'approved' },
  ])
  vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({
    programId: 'p1',
    status: 'approved',
    items: [{ id: 'i1', songId: 's1', title: 'Xin Vâng' }],
  })
  vi.spyOn(participationApi, 'getParticipation').mockResolvedValue([
    { memberId: 'm1', fullName: 'Gioan B. Phạm Hữu Tài', skills: ['Bass'], response: 'confirmed' },
    { memberId: 'm2', fullName: 'Simon Phan Văn Đức', skills: ['Bass'], response: 'confirmed' },
    { memberId: 'm3', fullName: 'Têrêsa Trần Kim Chi', skills: ['Alto'], response: 'confirmed' },
  ])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PracticePage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    renderPractice()

    expect(await screen.findByRole('heading', { name: 'Không thể tải bài tập luyện tập' })).toBeInTheDocument()
  })

  it('cannot assign without an approved song list', async () => {
    vi.spyOn(songListsApi, 'getSongList').mockResolvedValue({ programId: 'p1', status: 'submitted', items: [] })
    vi.spyOn(practiceApi, 'listAssignments').mockResolvedValue([])
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue([])
    renderPractice()

    expect(await screen.findByText('Cần danh sách bài hát đã được duyệt để giao bài tập.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Giao bài tập/ })).toBeDisabled()
  })

  it('shows progress and filters members who have not submitted', async () => {
    withData()
    renderPractice()

    expect(await screen.findByText('1/2')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Chưa nộp (1)'))
    expect(screen.queryByText('Gioan B. Phạm Hữu Tài')).toBeNull()
    expect(screen.getByText('Simon Phan Văn Đức')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đánh giá bài nộp của Simon Phan Văn Đức' })).toBeNull()
  })

  it('requires feedback for "Cần chỉnh sửa" and saves the review', async () => {
    withData()
    const review = vi.spyOn(practiceApi, 'reviewSubmission').mockResolvedValue(submissions[0])
    renderPractice()

    fireEvent.click(await screen.findByRole('button', { name: 'Đánh giá bài nộp của Gioan B. Phạm Hữu Tài' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByText('Cần chỉnh sửa'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu đánh giá' }))
    expect(await within(dialog).findByText('Vui lòng nhập nhận xét khi cần chỉnh sửa.')).toBeInTheDocument()
    expect(review).not.toHaveBeenCalled()

    fireEvent.change(within(dialog).getByRole('textbox'), { target: { value: 'Giữ nhịp đều hơn.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu đánh giá' }))
    await waitFor(() => expect(review).toHaveBeenCalledWith('a1:m1', { result: 'needsRevision', feedback: 'Giữ nhịp đều hơn.' }))
  })

  it('reviews a resubmission as a new review and keeps the earlier one as history', async () => {
    const earlier = dayjs().subtract(2, 'day').toISOString()
    vi.spyOn(practiceApi, 'listAssignments').mockResolvedValue([assignment])
    vi.spyOn(practiceApi, 'listSubmissions').mockResolvedValue([
      {
        ...submissions[0],
        reviews: [{ submittedAt: earlier, result: 'needsRevision', feedback: 'Thu lại đoạn cao trào.', reviewedAt: earlier }],
      },
    ])
    renderPractice()

    fireEvent.click(await screen.findByRole('button', { name: 'Đánh giá bài nộp của Gioan B. Phạm Hữu Tài' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Đánh giá bài nộp')).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox')).toHaveValue('')
    expect(within(dialog).getByText('Thu lại đoạn cao trào.')).toBeInTheDocument()
  })

  it('shows how many confirmed members an assignment reaches', async () => {
    withData()
    renderPractice()

    const create = await screen.findByRole('button', { name: /Giao bài tập/ })
    await waitFor(() => expect(create).toBeEnabled())
    fireEvent.click(create)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Sẽ giao cho 3 ca viên.')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByText('Theo kỹ năng'))
    const skills = await within(dialog).findByLabelText('Kỹ năng')
    fireEvent.mouseDown(within(skills.closest('.ant-select') as HTMLElement).getByRole('combobox'))
    fireEvent.click(await screen.findByTitle('Bass'))
    expect(await within(dialog).findByText('Sẽ giao cho 2 ca viên.')).toBeInTheDocument()
  })
})
