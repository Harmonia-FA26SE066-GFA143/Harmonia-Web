import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import { programPage } from '@/test/programs'
import * as programsApi from '../api/programsApi'
import type { LiturgicalProgramDetail } from '../types'
import { DirectorProgramDetailPage } from './DirectorProgramDetailPage'
import { DirectorProgramListPage } from './DirectorProgramListPage'

const program: LiturgicalProgramDetail = {
  id: 'p1',
  eventName: 'Lễ Chúa Nhật XXVI',
  date: '2026-09-27',
  time: '08:00',
  locationName: 'Nhà thờ',
  status: 'published',
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
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programPage(program))
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByText('Lễ Chúa Nhật XXVI')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tạo chương trình/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Lễ Chúa Nhật XXVI' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/programs/p1')
  })

  it('pages on the server and marks cancelled programs', async () => {
    const list = vi
      .spyOn(programsApi, 'listPrograms')
      .mockResolvedValue(programPage(program, { id: 'p2', eventName: 'Lễ Bổn mạng', date: '2026-10-04', status: 'cancelled' }))
    renderPage(<DirectorProgramListPage />, '/director/programs')

    expect(await screen.findByText('Lễ Bổn mạng')).toBeInTheDocument()
    expect(screen.getByText('Đã hủy')).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith({}, { pageNumber: 1, pageSize: 20 })
  })
})

describe('DirectorProgramDetailPage', () => {
  it('reads the published event and its newest song list, which may not exist yet', async () => {
    vi.spyOn(client, 'apiRequest').mockImplementation(async (path: string) => {
      if (path === '/api/schedule/events/p1') {
        return {
          id: 'p1',
          eventDate: '2026-10-04',
          time: '07:30:00',
          title: null,
          locationName: 'Nhà thờ chính',
          liturgicalSeasonName: 'Mùa Thường Niên',
          massTypeName: 'Lễ Chúa Nhật',
          ceremonyTypeName: null,
          specialRequirements: null,
        }
      }
      if (path === '/api/song-lists/event/p1/latest') throw new ApiError(404, { code: 'SONG_LIST_NOT_FOUND' })
      throw new Error(`unexpected ${path}`)
    })
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Lễ Chúa Nhật' })).toBeInTheDocument()
    expect(screen.getByText('Nhà thờ chính')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đề xuất danh sách bài hát' })).toBeInTheDocument()
  })


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
