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

  it('loads the report of the selected tab, page by page on the server, with the columns of the backend', async () => {
    const getReport = vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
      kind === 'participation'
        ? { ...empty, totalCount: 1, items: [{ id: 'm1', cells: { fullName: 'Simon Đức', confirmedCount: 3, declinedCount: 1 } }] }
        : empty,
    )
    const getColumns = vi.spyOn(reportsApi, 'getReportColumns').mockResolvedValue([
      { key: 'fullName', title: 'Họ tên' },
      { key: 'confirmedCount', title: 'Xác nhận' },
      { key: 'declinedCount', title: 'Từ chối' },
    ])
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(await screen.findByRole('tab', { name: 'Xác nhận tham gia' }))
    expect(await screen.findByText('Simon Đức')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Họ tên' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Từ chối' })).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('participation', {}, { pageNumber: 1, pageSize: 20 })
    expect(getColumns).toHaveBeenCalledWith('participation')
  })

  it('shows "Chưa có dữ liệu" in a report cell the backend left empty', async () => {
    vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
      kind === 'participation'
        ? { ...empty, totalCount: 1, items: [{ id: 'm1', cells: { fullName: 'Simon Đức', confirmedCount: 3, declinedCount: '' } }] }
        : empty,
    )
    vi.spyOn(reportsApi, 'getReportColumns').mockResolvedValue([
      { key: 'fullName', title: 'Họ tên' },
      { key: 'confirmedCount', title: 'Xác nhận' },
      { key: 'declinedCount', title: 'Từ chối' },
    ])
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.click(await screen.findByRole('tab', { name: 'Xác nhận tham gia' }))
    const row = (await screen.findByText('Simon Đức')).closest('tr') as HTMLElement
    expect(within(row).getByText('Chưa có dữ liệu')).toBeInTheDocument()
    expect(within(row).queryByText('—')).toBeNull()
    expect(within(row).queryByText('Chưa cập nhật')).toBeNull()
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

  it('narrows the per-member reports, the chart and the export to the choir in the address', async () => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
      { id: 'c1', name: 'Ca đoàn Cêcilia', isActive: true },
      { id: 'c2', name: 'Ca đoàn Giuse', isActive: false },
    ])
    const getReport = vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const trend = vi.spyOn(reportsApi, 'getActivityTrend').mockResolvedValue([])
    const exportReport = vi.spyOn(reportsApi, 'exportReport').mockResolvedValue(new Blob(['x']))
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage(<AdminReportsPage />, '/admin/reports', '/admin/reports?kind=rehearsalAttendance&month=2026-10&choirId=c1')

    expect(await screen.findByText('Ca đoàn Cêcilia')).toBeInTheDocument()
    await waitFor(() =>
      expect(getReport).toHaveBeenCalledWith('rehearsalAttendance', { month: '2026-10', choirId: 'c1' }, { pageNumber: 1, pageSize: 20 }),
    )
    expect(trend).toHaveBeenCalledWith(expect.objectContaining({ fromDate: '2025-11-01', toDate: '2026-10-31', choirId: 'c1' }))
    // A filtered view with no rows offers to clear the filters (the filter bar's reset now uses the same words).
    expect(await screen.findAllByRole('button', { name: /Xoá bộ lọc/ })).toHaveLength(2)
    // The Admin chart keeps its own toggle.
    expect(screen.getByRole('radio', { name: 'Bài tập' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Xuất báo cáo/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/chỉ gồm ca viên của ca đoàn đang lọc/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xuất báo cáo' }))
    await waitFor(() =>
      expect(exportReport).toHaveBeenCalledWith({
        kind: 'rehearsalAttendance',
        format: 'xlsx',
        filters: { month: '2026-10', choirId: 'c1' },
      }),
    )
  })

  it('shows the choir filter to the Admin with inactive choirs marked', async () => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([{ id: 'c2', name: 'Ca đoàn Giuse', isActive: false }])
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    renderPage(<AdminReportsPage />, '/admin/reports')

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Ca đoàn' }))
    expect(await screen.findByTitle('Ca đoàn Giuse (ngừng hoạt động)')).toBeInTheDocument()
  })
})

describe('DirectorReportsPage', () => {
  beforeEach(() => {
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
      { id: 'c1', name: 'Ca đoàn Cêcilia', isActive: true },
    ])
  })

  it('reads the per-member report of the backend for the month and choir in the address', async () => {
    const report = {
      ...empty,
      totalCount: 1,
      totalPages: 1,
      items: [{ memberId: 'm1', fullName: 'Simon Đức', presentCount: 6, lateCount: 1, excusedCount: 0, absentCount: 1 }],
    }
    const columns = [
      { key: 'fullName', title: 'Họ tên' },
      { key: 'lateCount', title: 'Đi trễ' },
    ]
    const request = vi
      .spyOn(client, 'apiRequest')
      .mockImplementation(async (path: string) => (path.startsWith('/api/reports/columns/') ? columns : report))
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?by=month&date=2026-10-15&choirId=c1')

    expect(await screen.findByText('Simon Đức')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Đi trễ' })).toBeInTheDocument()
    expect(request).toHaveBeenCalledWith('/api/reports/columns/RehearsalAttendance')
    for (const name of ['Điểm danh', 'Xác nhận tham gia', 'Hoàn thành bài tập']) {
      expect(screen.getAllByRole('radio', { name }).length).toBeGreaterThan(0)
    }
    expect(request).toHaveBeenCalledWith(
      '/api/reports/rehearsal-attendance?fromDate=2026-10-01&toDate=2026-10-31&choirId=c1&pageNumber=1&pageSize=20',
    )
    expect(screen.getByText('01/10 – 31/10/2026')).toBeInTheDocument()
  })

  it('exports the open report for the chosen week in the chosen format', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    const exportReport = vi.spyOn(reportsApi, 'exportReport').mockResolvedValue(new Blob(['x']))
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?tab=participation&by=week&date=2026-10-15')

    fireEvent.click(await screen.findByRole('button', { name: /Xuất báo cáo/ }))
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
  const memberPage = (items: Record<string, string | number>[], totalCount = items.length) => ({
    ...empty,
    totalCount,
    totalPages: 1,
    items: items.map(({ memberId, ...cells }) => ({ id: String(memberId), cells })),
  })

  it('locks the chart to attendance on the attendance tab, with its headlines and watch card', async () => {
    vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
      kind === 'rehearsalAttendance'
        ? memberPage([{ memberId: 'm1', fullName: 'Simon Đức', presentCount: 2, lateCount: 0, excusedCount: 0, absentCount: 3 }])
        : empty,
    )
    vi.spyOn(reportsApi, 'getReportColumns').mockResolvedValue([{ key: 'fullName', title: 'Họ tên' }])
    const trend = vi
      .spyOn(reportsApi, 'getActivityTrend')
      .mockResolvedValue([point('2026-10-01', '2026-10-04', 3), point('2026-10-05', '2026-10-11', 0)])
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?by=month&date=2026-10-15&choirId=c1')

    expect(await screen.findByText('Theo tuần trong tháng 10/2026')).toBeInTheDocument()
    expect(trend).toHaveBeenCalledWith({ groupBy: 'week', fromDate: '2026-10-01', toDate: '2026-10-31', choirId: 'c1' })
    expect(
      await screen.findByRole('img', { name: 'Tuần 01/10 – 04/10/2026 · chuyên cần 100%: 3 có mặt, 1 đi trễ' }),
    ).toBeInTheDocument()
    // The page tab decides the chart: no "Điểm danh | Bài tập" toggle here.
    expect(screen.queryByRole('radio', { name: 'Bài tập' })).toBeNull()
    // Headlines use the glossary word "Đi trễ".
    expect(screen.getAllByText('Đi trễ').length).toBeGreaterThan(0)
    expect(screen.queryByText('Đi muộn')).toBeNull()
    expect(await screen.findByText('3 vắng')).toBeInTheDocument()
  })

  it('shows the practice chart and the practice watch on the assignment completion tab', async () => {
    vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
      kind === 'assignmentCompletion'
        ? memberPage([
            { memberId: 'm1', fullName: 'Simon Đức', assignedCount: 3, passedCount: 0, needsRevisionCount: 1, awaitingReviewCount: 0, notSubmittedCount: 2 },
            { memberId: 'm2', fullName: 'Anna Mai', assignedCount: 2, passedCount: 0, needsRevisionCount: 0, awaitingReviewCount: 2, notSubmittedCount: 0 },
          ])
        : empty,
    )
    vi.spyOn(reportsApi, 'getReportColumns').mockResolvedValue([{ key: 'fullName', title: 'Họ tên' }])
    vi.spyOn(reportsApi, 'getActivityTrend').mockResolvedValue([point('2026-10-01', '2026-10-04', 3)])
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?tab=assignmentCompletion&by=month&date=2026-10-15')

    expect(
      await screen.findByRole('img', { name: 'Tuần 01/10 – 04/10/2026 · hoàn thành 50%: 1 đạt, 1 chưa nộp' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Điểm danh', checked: true })).toBeNull()
    expect(await screen.findByText('2 chưa nộp')).toBeInTheDocument()
    // Anna has nothing missing or to redo, so she is not ranked; her recordings are counted in the reminder.
    expect(screen.getByText(/2 bản thu đang chờ nhận xét/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chấm bài' })).toBeInTheDocument()
  })

  it.each([
    [[], 'Chưa có ca viên nào trong kỳ này.'],
    [[{ assignedCount: 0, passedCount: 0, needsRevisionCount: 0, awaitingReviewCount: 0, notSubmittedCount: 0 }], 'Chưa có bài tập nào đến hạn trong kỳ này.'],
    [[{ assignedCount: 2, passedCount: 1, needsRevisionCount: 0, awaitingReviewCount: 1, notSubmittedCount: 0 }], 'Không ca viên nào chưa nộp hoặc cần chỉnh sửa. Còn 1 bản thu đang chờ nhận xét.'],
    [[{ assignedCount: 2, passedCount: 2, needsRevisionCount: 0, awaitingReviewCount: 0, notSubmittedCount: 0 }], 'Mọi bài tập đến hạn trong kỳ đều đã đạt.'],
  ])('says honestly why nobody needs attention for practice (%#)', async (rows, text) => {
    vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
      kind === 'assignmentCompletion' ? memberPage(rows.map((row, i) => ({ memberId: `m${i}`, fullName: `Ca viên ${i}`, ...row }))) : empty,
    )
    vi.spyOn(reportsApi, 'getReportColumns').mockResolvedValue([{ key: 'fullName', title: 'Họ tên' }])
    vi.spyOn(reportsApi, 'getActivityTrend').mockResolvedValue([])
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?tab=assignmentCompletion&by=month&date=2026-10-15')

    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.queryByText(/đúng hạn/)).toBeNull()
    // The waiting recordings are told once, never in both the reminder line and the empty state.
    expect(screen.queryAllByText(/bản thu đang chờ nhận xét/).length).toBeLessThanOrEqual(1)
    if (text.includes('đang chờ nhận xét')) expect(screen.getByRole('link', { name: 'Chấm bài' })).toBeInTheDocument()
  })

  it('sums participation for its headlines and watch, with an honest scope note and no attendance chart', async () => {
    const getReport = vi.spyOn(reportsApi, 'getReport').mockImplementation(async (kind: AdminReportKind) =>
      kind === 'participation'
        ? memberPage(
            [
              { memberId: 'm1', fullName: 'Simon Đức', invitedCount: 2, confirmedCount: 1, declinedCount: 0, unsureCount: 1 },
              { memberId: 'm2', fullName: 'Anna Mai', invitedCount: 0, confirmedCount: 3, declinedCount: 1, unsureCount: 0 },
            ],
            150,
          )
        : empty,
    )
    vi.spyOn(reportsApi, 'getReportColumns').mockResolvedValue([{ key: 'fullName', title: 'Họ tên' }])
    const trend = vi.spyOn(reportsApi, 'getActivityTrend').mockResolvedValue([])
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?tab=participation&by=month&date=2026-10-15')

    const sent = (await screen.findByText('Lượt mời đã gửi')).closest('.ctb-figure') as HTMLElement
    expect(within(sent).getByText('8')).toBeInTheDocument()
    expect(within(sent).getByText('trong 2/150 ca viên')).toBeInTheDocument()
    const rate = screen.getByText('Tỉ lệ xác nhận').closest('.ctb-figure') as HTMLElement
    expect(within(rate).getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Phân bố phản hồi trong kỳ')).toBeInTheDocument()
    expect(screen.getByText('Cần quan tâm — phản hồi tham gia')).toBeInTheDocument()
    // Most pending (unanswered + unsure) first; the line names what is missing.
    expect(screen.getByText('2 chưa phản hồi')).toBeInTheDocument()
    expect(screen.getByText('1 từ chối')).toBeInTheDocument()
    expect(screen.getByText(/Xếp trong 2 ca viên đầu của 150 người trong kỳ\./)).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledWith('participation', expect.objectContaining({ fromDate: '2026-10-01' }), { pageNumber: 1, pageSize: 100 })
    expect(trend).not.toHaveBeenCalled()
    expect(screen.queryByText(/Theo tuần trong tháng/)).toBeNull()
  })

  it('shows "Chưa có dữ liệu" for a rate with nothing to divide by', async () => {
    vi.spyOn(reportsApi, 'getReport').mockResolvedValue(empty)
    vi.spyOn(reportsApi, 'getActivityTrend').mockResolvedValue([])
    renderPage(<DirectorReportsPage />, '/director/reports', '/director/reports?by=month&date=2026-10-15')

    expect(await screen.findByText('Tỉ lệ có mặt')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa có dữ liệu').length).toBeGreaterThan(0)
  })
})
