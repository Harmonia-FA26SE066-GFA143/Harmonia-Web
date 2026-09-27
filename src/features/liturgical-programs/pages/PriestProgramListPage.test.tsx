import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as programsApi from '../api/programsApi'
import type { LiturgicalProgram } from '../types'
import { PriestProgramListPage } from './PriestProgramListPage'

const programs: LiturgicalProgram[] = [
  {
    id: 'p1',
    eventName: 'Lễ Chúa Nhật XXVI',
    date: '2026-09-27',
    season: { id: 's5', name: 'Mùa Thường Niên' },
    massType: { id: 'm1', name: 'Lễ Chúa Nhật' },
    songListStatus: 'submitted',
  },
  { id: 'p2', eventName: 'Giờ Chầu Thánh Thể', date: '2026-10-01' },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriestProgramListPage', () => {
  it('shows a recoverable error while the programs API contract is missing', async () => {
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách chương trình' })).toBeInTheDocument()
  })

  it('shows the empty state with a create action', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue([])
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByRole('heading', { name: 'Chưa có chương trình phụng vụ nào' })).toBeInTheDocument()
  })

  it('lists programs with FE-16 fields and the song-list condition', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programs)
    renderPage(<PriestProgramListPage />, '/priest/programs')

    expect(await screen.findByText('Lễ Chúa Nhật XXVI')).toBeInTheDocument()
    expect(screen.getByText('27/09/2026')).toBeInTheDocument()
    expect(screen.getByText('Mùa Thường Niên')).toBeInTheDocument()
    expect(screen.getByText('Chờ xem xét')).toBeInTheDocument()
    expect(screen.getByText('Chưa có')).toBeInTheDocument()
  })

  it('filters by keyword and opens a program', async () => {
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(programs)
    renderPage(<PriestProgramListPage />, '/priest/programs')

    const search = await screen.findByRole('textbox', { name: 'Tìm chương trình phụng vụ' })
    fireEvent.change(search, { target: { value: 'chau' } })
    expect(screen.queryByText('Lễ Chúa Nhật XXVI')).toBeNull()

    fireEvent.change(search, { target: { value: 'không có' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Xoá bộ lọc/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Xem chi tiết Lễ Chúa Nhật XXVI' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/p1')
  })
})
