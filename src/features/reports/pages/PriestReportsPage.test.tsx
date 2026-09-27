import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as reportsApi from '../api/reportsApi'
import { PriestReportsPage } from './PriestReportsPage'

afterEach(() => {
  vi.restoreAllMocks()
})

const serviceHistory = {
  metrics: {},
  rows: [
    { id: 'h1', programId: 'p1', cells: { program: 'Lễ Chúa Nhật XX', date: '20/09/2026', season: 'Mùa Thường Niên' } },
    { id: 'h2', programId: 'p2', cells: { program: 'Giờ Chầu Thánh Thể', date: '03/09/2026', season: 'Mùa Thường Niên' } },
  ],
}

describe('PriestReportsPage', () => {
  it('offers the three FE-22 reports', async () => {
    renderPage(<PriestReportsPage />, '/priest/reports')

    for (const name of ['Lịch sử phục vụ', 'Sử dụng bài hát', 'Tình trạng chuẩn bị']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(await screen.findByRole('heading', { name: 'Không thể tải báo cáo' })).toBeInTheDocument()
  })

  it('shows the empty state when there is no data and no filter', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue({ metrics: {}, rows: [] })
    renderPage(<PriestReportsPage />, '/priest/reports')

    expect(await screen.findByRole('heading', { name: 'Chưa có lịch sử phục vụ' })).toBeInTheDocument()
  })

  it('searches rows and opens a program from the report', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(serviceHistory)
    renderPage(<PriestReportsPage />, '/priest/reports')

    expect(await screen.findByText('Lễ Chúa Nhật XX')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm trong báo cáo' }), { target: { value: 'chau' } })
    expect(screen.queryByText('Lễ Chúa Nhật XX')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Xem chương trình' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/priest/programs/p2')
  })

  it('distinguishes no search results from no data', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(serviceHistory)
    renderPage(<PriestReportsPage />, '/priest/reports')

    fireEvent.change(await screen.findByRole('textbox', { name: 'Tìm trong báo cáo' }), { target: { value: 'xyz' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Xoá bộ lọc/ }))
    expect(screen.getByText('Lễ Chúa Nhật XX')).toBeInTheDocument()
  })
})
