import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as programsApi from '../api/programsApi'
import type { LiturgicalProgramDetail } from '../types'
import { DirectorProgramDetailPage } from './DirectorProgramDetailPage'
import { DirectorProgramListPage } from './DirectorProgramListPage'

const program: LiturgicalProgramDetail = {
  id: 'p1',
  eventName: 'Lễ Chúa Nhật XXVI',
  date: '2026-09-27',
  songListStatus: 'needsRevision',
  songs: [{ id: 'a', liturgicalPart: 'Ca nhập lễ', title: 'Con Bước Lên Bàn Thờ' }],
}

const renderDetail = () =>
  renderPage(<DirectorProgramDetailPage />, '/director/programs/:programId', '/director/programs/p1')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DirectorProgramListPage', () => {
  it('lists programs without a create action and opens the director detail', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([program])
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByText('Lễ Chúa Nhật XXVI')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tạo chương trình/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Lễ Chúa Nhật XXVI' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p1')
  })
})

describe('DirectorProgramDetailPage', () => {
  it('shows the song list and opens the proposal for editing after a revision request', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(program)
    renderDetail()

    expect(await screen.findByText('Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(screen.getByText('Yêu cầu chỉnh sửa')).toBeInTheDocument()
    expect(screen.getByText(/Lịch tập/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa danh sách bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p1/song-list')
  })

  it.each([
    [undefined, 'Đề xuất danh sách bài hát'],
    ['submitted', 'Xem danh sách đề xuất'],
    ['approved', 'Xem danh sách đề xuất'],
  ] as const)('labels the song-list action for status %s', async (status, label) => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: status })
    renderDetail()

    expect(await screen.findByRole('button', { name: label })).toBeInTheDocument()
  })
})
