import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as categoriesApi from '@/features/system-categories/api/categoriesApi'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as reportsApi from '../api/reportsApi'
import type { AdminReportKind } from '../types'
import { AdminReportsPage } from './AdminReportsPage'
import { DirectorReportsPage } from './DirectorReportsPage'

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
    const getReport = vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
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

describe('DirectorReportsPage', () => {
  beforeEach(() => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
      { id: 'c1', name: 'Ca đoàn Cêcilia', isActive: true },
    ])
  })

  it('reads the per-member report of the backend for the month and choir in the address', async () => {
    const request = vi.spyOn(client, 'apiRequest').mockResolvedValue({
      ...empty,
      totalCount: 1,
      totalPages: 1,
      items: [{ memberId: 'm1', fullName: 'Simon Đức', presentCount: 6, lateCount: 1, excusedCount: 0, absentCount: 1 }],
    })
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?by=month&date=2026-10-15&choirId=c1')

    expect(await screen.findByText('Simon Đức')).toBeInTheDocument()
    for (const name of ['Điểm danh', 'Xác nhận tham gia', 'Hoàn thành bài tập']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(request).toHaveBeenCalledWith(
      '/api/reports/rehearsal-attendance?fromDate=2026-10-01&toDate=2026-10-31&choirId=c1&pageNumber=1&pageSize=20',
    )
    expect(screen.getByText('Từ 01/10/2026 đến 31/10/2026')).toBeInTheDocument()
  })

  it('exports the open report for the chosen week in the chosen format', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const exportReport = vi.spyOn(reportsApi, 'exportReport').mockResolvedValue(new Blob(['x']))
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?tab=participation&by=week&date=2026-10-15')

    fireEvent.click(await screen.findByRole('button', { name: /Xuất xác nhận tham gia/ }))
    fireEvent.click(await screen.findByText('Excel (XLSX)'))

    await waitFor(() =>
      expect(exportReport).toHaveBeenCalledWith({
        kind: 'participation',
        format: 'xlsx',
        filters: { fromDate: '2026-10-12', toDate: '2026-10-18', choirId: undefined },
      }),
    )
    expect(await screen.findByText('Đã xuất báo cáo.')).toBeInTheDocument()
  })

  it('charts attendance by week of the chosen month, and practice on demand', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const point = (periodStart: string, periodEnd: string, present: number) => ({
      periodStart,
      periodEnd,
      rehearsalsRecorded: 1,
      presentCount: present,
      lateCount: 1,
      absentCount: 0,
      excusedCount: 0,
      attendanceRate: present ? 1 : undefined,
      assignmentsDue: 1,
      assignedCount: 2,
      passedCount: 1,
      needsRevisionCount: 0,
      awaitingReviewCount: 0,
      notSubmittedCount: 1,
      completionRate: 0.5,
    })
    const trend = vi
      .spyOn(reportsApi, 'getActivityTrend')
      .mockResolvedValue([point('2026-10-01', '2026-10-04', 3), point('2026-10-05', '2026-10-11', 0)])
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?by=month&date=2026-10-15&choirId=c1')

    expect(await screen.findByText('Theo tuần trong tháng 10/2026')).toBeInTheDocument()
    expect(trend).toHaveBeenCalledWith({ groupBy: 'week', fromDate: '2026-10-01', toDate: '2026-10-31', choirId: 'c1' })
    expect(
      await screen.findByRole('img', { name: 'Tuần 01/10 – 04/10/2026 · chuyên cần 100%: 3 có mặt, 1 đi muộn' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText('Bài tập'))
    expect(
      await screen.findByRole('img', { name: 'Tuần 01/10 – 04/10/2026 · hoàn thành 50%: 1 đạt, 1 chưa nộp' }),
    ).toBeInTheDocument()
  })
})
