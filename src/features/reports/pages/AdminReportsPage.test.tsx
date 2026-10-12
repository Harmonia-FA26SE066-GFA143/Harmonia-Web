import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as reportsApi from '../api/reportsApi'
import type { ReportKind } from '../types'
import { AdminReportsPage } from './AdminReportsPage'

const empty = { items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 }

beforeEach(() => {
  vi.spyOn(reportsApi, 'listExports').mockResolvedValue({ ...empty, pageSize: 10 })
  vi.spyOn(categoriesApi, 'listLookup').mockResolvedValue([{ id: 's5', name: 'Mùa Thường Niên' }])
  // jsdom has no object URLs; the click on the download link is checked instead.
  Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:report'), revokeObjectURL: vi.fn() })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminReportsPage', () => {
  it('offers the four FE-52 reports and the two of the Priest, and shows a recoverable error', async () => {
    vi.spyOn(reportsApi, 'getReport').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<AdminReportsPage />, '/admin/reports')

    for (const name of [
      'Hoạt động người dùng',
      'Điểm danh',
      'Xác nhận tham gia',
      'Hoàn thành bài tập',
      'Lịch sử phục vụ',
      'Sử dụng bài hát',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(await screen.findByRole('heading', { name: 'Không thể tải báo cáo' })).toBeInTheDocument()
    expect(await screen.findByText('Chưa có lần xuất báo cáo nào.')).toBeInTheDocument()
  })

  it('loads the report of the selected tab, page by page on the server', async () => {
    const getReport = vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: ReportKind) =>
      kind === 'participation'
        ? { ...empty, totalCount: 1, items: [{ id: 'm1', cells: { member: 'Simon Đức', confirmed: 3, declined: 1, unsure: 0, invited: 2 } }] }
        : empty,
    )
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(await screen.findByRole('tab', { name: 'Xác nhận tham gia' }))
    expect(await screen.findByText('Simon Đức')).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('participation', {}, { pageNumber: 1, pageSize: 20 })
  })

  it('exports by liturgical season in the chosen format and saves the file', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const exportReport = vi.spyOn(reportsApi, 'exportReport').mockResolvedValue(new Blob(['x']))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(screen.getByRole('button', { name: /Xuất báo cáo/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: 'CSV' }))
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Theo mùa phụng vụ' }))
    fireEvent.mouseDown(await within(dialog).findByRole('combobox', { name: 'Mùa phụng vụ' }))
    fireEvent.click(await screen.findByTitle('Mùa Thường Niên'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xuất báo cáo' }))

    await waitFor(() =>
      expect(exportReport).toHaveBeenCalledWith({ kind: 'userActivity', format: 'csv', filters: { seasonId: 's5' } }),
    )
    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(await screen.findByText('Đã xuất báo cáo.')).toBeInTheDocument()
  })

  it('starts the export from the month already chosen on the page and explains an empty export', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const exportReport = vi
      .spyOn(reportsApi, 'exportReport')
      .mockRejectedValue(new ApiError(404, { code: 'REPORT_NO_DATA' }))
    renderPage(<AdminReportsPage />, '/admin/reports', '/admin/reports?kind=participation&month=2026-09')

    expect(await screen.findByRole('tab', { name: 'Xác nhận tham gia', selected: true })).toBeInTheDocument()
    expect(screen.getByLabelText('Tháng')).toHaveValue('09/2026')

    fireEvent.click(screen.getByRole('button', { name: /Xuất báo cáo/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('radio', { name: 'Theo tháng' })).toBeChecked()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xuất báo cáo' }))

    await waitFor(() =>
      expect(exportReport).toHaveBeenCalledWith({ kind: 'participation', format: 'xlsx', filters: { month: '2026-09' } }),
    )
    expect(await screen.findByText('Không có dữ liệu nào để xuất theo phạm vi đã chọn.')).toBeInTheDocument()
  })

  it('requires a month before exporting by month', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const exportReport = vi.spyOn(reportsApi, 'exportReport')
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(screen.getByRole('button', { name: /Xuất báo cáo/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xuất báo cáo' }))

    expect(await within(dialog).findByText('Vui lòng chọn tháng.')).toBeInTheDocument()
    expect(exportReport).not.toHaveBeenCalled()
  })
})
