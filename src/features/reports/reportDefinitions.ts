import type { AdminReportKind, DirectorReportKind, PriestReportKind } from './types'

export interface ReportDefinition {
  label: string
  description: string
  emptyTitle: string
}

/**
 * Wording of each report page. The table columns and their titles come from the backend (`GET /api/reports/columns`,
 * the same as the exported file); every value is the backend's own count.
 */
export const reportDefinitions: Record<AdminReportKind, ReportDefinition> = {
  serviceHistory: {
    label: 'Lịch sử phục vụ',
    description: 'Các sự kiện đã diễn ra và kết quả chuẩn bị của ca đoàn cho từng sự kiện.',
    emptyTitle: 'Chưa có lịch sử phục vụ',
  },
  songUsage: {
    label: 'Sử dụng bài hát',
    description: 'Số sự kiện đã diễn ra có bài hát trong danh sách đã duyệt.',
    emptyTitle: 'Chưa có dữ liệu sử dụng bài hát',
  },
  userActivity: {
    label: 'Hoạt động người dùng',
    description: 'Mỗi tài khoản: lần đăng nhập gần nhất và các thao tác nhạy cảm trong khoảng thời gian.',
    emptyTitle: 'Chưa có dữ liệu hoạt động',
  },
  rehearsalAttendance: {
    label: 'Điểm danh',
    description: 'Kết quả điểm danh của mỗi ca viên đang sinh hoạt qua các buổi tập trong khoảng thời gian.',
    emptyTitle: 'Chưa có dữ liệu điểm danh',
  },
  participation: {
    label: 'Xác nhận tham gia',
    description: 'Câu trả lời của mỗi ca viên đang sinh hoạt cho các yêu cầu xác nhận tham gia.',
    emptyTitle: 'Chưa có dữ liệu xác nhận tham gia',
  },
  assignmentCompletion: {
    label: 'Hoàn thành bài tập',
    description: 'Bài tập đến hạn trong khoảng thời gian của mỗi ca viên, theo lần nộp mới nhất.',
    emptyTitle: 'Chưa có dữ liệu bài tập',
  },
}

/** Date and time columns, shown in the numeric font like the counts. */
export const dateColumnKeys = new Set(['eventDate', 'time', 'lastUsedDate', 'lastLoginAt'])

export const priestReportKinds: PriestReportKind[] = ['serviceHistory', 'songUsage']

/** The four FE-52 reports first; the Admin may also read and export the Priest's two (ReportsController). */
export const adminReportKinds: AdminReportKind[] = [
  'userActivity',
  'rehearsalAttendance',
  'participation',
  'assignmentCompletion',
  'serviceHistory',
  'songUsage',
]

/** The three per-member reports the Choir Director reads and exports (ReportsController, BE 446f429). */
export const directorReportKinds: DirectorReportKind[] = ['rehearsalAttendance', 'participation', 'assignmentCompletion']
