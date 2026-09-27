import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as programsApi from '../api/programsApi'
import type { LiturgicalProgramDetail } from '../types'
import { PriestProgramDetailPage } from './PriestProgramDetailPage'

const program: LiturgicalProgramDetail = {
  id: 'p1',
  eventName: 'Lễ Chúa Nhật XXVI',
  date: '2026-09-27',
  season: { id: 's5', name: 'Mùa Thường Niên' },
  specialRequirements: 'Ưu tiên bài hát theo chủ đề Lời Chúa.',
  songListStatus: 'submitted',
  songs: [
    { id: 'a', liturgicalPart: 'Ca nhập lễ', title: 'Con Bước Lên Bàn Thờ' },
    { id: 'b', title: 'Lễ Vật Tâm Tình' },
  ],
}

// The page reads :programId, so it is rendered under the parameterised route.
const renderDetail = () => renderPage(<PriestProgramDetailPage />, '/priest/programs/:programId', '/priest/programs/p1')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestProgramDetailPage', () => {
  it('shows a recoverable error while the API contract is missing', async () => {
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không thể tải chương trình' })).toBeInTheDocument()
  })

  it('shows the not-found state for an unknown program', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue(null)
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Không tìm thấy chương trình phụng vụ' })).toBeInTheDocument()
  })

  it('shows the FE-16 information and song list, and opens the song-list review', async () => {
    const get = vi.spyOn(programsApi, 'getProgram').mockResolvedValue(program)
    renderDetail()

    expect(await screen.findByRole('heading', { level: 1, name: 'Lễ Chúa Nhật XXVI' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('p1')
    expect(screen.getByText('Ưu tiên bài hát theo chủ đề Lời Chúa.')).toBeInTheDocument()
    expect(screen.getByText('Con Bước Lên Bàn Thờ')).toBeInTheDocument()
    expect(screen.getByText('Chờ xem xét')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Công bố/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Xem danh sách bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/p1/song-review')
  })

  it('explains when no song list has been proposed yet', async () => {
    vi.spyOn(programsApi, 'getProgram').mockResolvedValue({ ...program, songListStatus: undefined, songs: [] })
    renderDetail()

    expect(await screen.findByText(/Chưa có danh sách bài hát/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xem danh sách bài hát' })).toBeNull()
  })
})
