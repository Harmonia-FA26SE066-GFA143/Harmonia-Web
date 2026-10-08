import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { renderPage } from '@/test/renderPage'
import * as reportsApi from '../api/reportsApi'
import type { ReportKind } from '../types'
import { AdminReportsPage } from './AdminReportsPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminReportsPage', () => {
  it('offers the four FE-52 reports and shows an error while the API contract is missing', async () => {
    renderPage(<AdminReportsPage />, '/admin/reports')

    for (const name of ['Điểm danh', 'Hoạt động người dùng', 'Xác nhận tham gia', 'Hoàn thành bài tập']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(await screen.findByRole('heading', { name: 'Không thể tải báo cáo' })).toBeInTheDocument()
  })

  it('shows backend metrics as returned, with "—" for a missing value', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue({
      metrics: { total: 32, present: 28 },
      rows: [{ id: 'r1', cells: { member: 'Maria Hướng', event: 'Lễ Chúa Nhật', status: 'Có mặt' } }],
    })
    renderPage(<AdminReportsPage />, '/admin/reports')

    expect(await screen.findByText('Maria Hướng')).toBeInTheDocument()
    expect(screen.getByText('32')).toBeInTheDocument()
    expect(screen.getByText('Vắng mặt').closest('.ant-card')).toHaveTextContent('—')
  })

  it('loads the report of the selected tab', async () => {
    const getReport = vi
      .spyOn(reportsApi, 'getReport')
      .mockImplementation(async (kind: ReportKind) => ({ metrics: {}, rows: kind === 'participation' ? [{ id: 'p', cells: { member: 'Simon Đức', response: 'Từ chối tham gia' } }] : [] }))
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(await screen.findByRole('tab', { name: 'Xác nhận tham gia' }))
    expect(await screen.findByText('Simon Đức')).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('participation', {})
  })

  it('exports by liturgical season using the season catalog', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue({ metrics: {}, rows: [] })
    vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([{ id: 's5', name: 'Mùa Thường Niên' }])
    const exportReport = vi.spyOn(reportsApi, 'exportReport').mockResolvedValue()
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(screen.getByRole('button', { name: /Xuất báo cáo/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Theo mùa phụng vụ' }))
    fireEvent.mouseDown(await within(dialog).findByRole('combobox', { name: 'Mùa phụng vụ' }))
    fireEvent.click(await screen.findByTitle('Mùa Thường Niên'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xuất báo cáo' }))

    await waitFor(() =>
      expect(exportReport).toHaveBeenCalledWith({ kind: 'rehearsalAttendance', scope: { type: 'season', seasonId: 's5' } }),
    )
  })

  it('requires a month before exporting by month', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue({ metrics: {}, rows: [] })
    const exportReport = vi.spyOn(reportsApi, 'exportReport')
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(screen.getByRole('button', { name: /Xuất báo cáo/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xuất báo cáo' }))

    expect(await within(dialog).findByText('Vui lòng chọn tháng.')).toBeInTheDocument()
    expect(exportReport).not.toHaveBeenCalled()
  })
})
