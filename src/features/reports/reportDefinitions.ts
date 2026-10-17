import type { AdminReportKind, PriestReportKind } from './types'

export interface ReportColumnDefinition {
  key: string
  title: string
  /** Counts, dates and times use the numeric font. */
  numeric?: boolean
}

export interface ReportDefinition {
  label: string
  description: string
  columns: ReportColumnDefinition[]
  emptyTitle: string
}

const member: ReportColumnDefinition = { key: 'member', title: 'Ca viên' }
const count = (key: string, title: string): ReportColumnDefinition => ({ key, title, numeric: true })

/** Columns follow the DTOs of Harmonia-BE ReportsController; every value is the backend's own count. */
export const reportDefinitions: Record<AdminReportKind, ReportDefinition> = {
  serviceHistory: {
    label: 'Lịch sử phục vụ',
    description: 'Các sự kiện đã diễn ra và kết quả chuẩn bị của ca đoàn cho từng sự kiện.',
    columns: [
      { key: 'event', title: 'Sự kiện' },
      { key: 'date', title: 'Ngày cử hành', numeric: true },
      { key: 'season', title: 'Mùa phụng vụ' },
      { key: 'location', title: 'Nơi cử hành' },
      count('songs', 'Số bài hát'),
      count('served', 'Người phục vụ'),
      count('confirmed', 'Xác nhận'),
      count('declined', 'Từ chối'),
      count('rehearsals', 'Buổi tập đã diễn ra'),
      count('present', 'Lượt có mặt'),
    ],
    emptyTitle: 'Chưa có lịch sử phục vụ',
  },
  songUsage: {
    label: 'Sử dụng bài hát',
    description: 'Số sự kiện đã diễn ra có bài hát trong danh sách đã duyệt.',
    columns: [
      { key: 'song', title: 'Bài hát' },
      { key: 'composer', title: 'Tác giả' },
      count('timesUsed', 'Số lần dùng'),
      { key: 'lastUsed', title: 'Lần dùng gần nhất', numeric: true },
    ],
    emptyTitle: 'Chưa có dữ liệu sử dụng bài hát',
  },
  userActivity: {
    label: 'Hoạt động người dùng',
    description: 'Mỗi tài khoản: lần đăng nhập gần nhất và các thao tác nhạy cảm trong khoảng thời gian.',
    columns: [
      { key: 'user', title: 'Người dùng' },
      { key: 'email', title: 'Email' },
      { key: 'role', title: 'Vai trò' },
      { key: 'status', title: 'Trạng thái' },
      { key: 'lastLogin', title: 'Đăng nhập gần nhất', numeric: true },
      count('passwordChanges', 'Đổi mật khẩu'),
      count('passwordResets', 'Đặt lại mật khẩu'),
      count('accountChanges', 'Sửa tài khoản'),
      count('actions', 'Số thao tác'),
    ],
    emptyTitle: 'Chưa có dữ liệu hoạt động',
  },
  rehearsalAttendance: {
    label: 'Điểm danh',
    description: 'Kết quả điểm danh của mỗi ca viên đang sinh hoạt qua các buổi tập trong khoảng thời gian.',
    columns: [member, count('present', 'Có mặt'), count('late', 'Đi muộn'), count('excused', 'Vắng có phép'), count('absent', 'Vắng không phép')],
    emptyTitle: 'Chưa có dữ liệu điểm danh',
  },
  participation: {
    label: 'Xác nhận tham gia',
    description: 'Câu trả lời của mỗi ca viên đang sinh hoạt cho các yêu cầu xác nhận tham gia.',
    columns: [member, count('confirmed', 'Xác nhận'), count('declined', 'Từ chối'), count('unsure', 'Chưa chắc chắn'), count('invited', 'Chưa phản hồi')],
    emptyTitle: 'Chưa có dữ liệu xác nhận tham gia',
  },
  assignmentCompletion: {
    label: 'Hoàn thành bài tập',
    description: 'Bài tập đến hạn trong khoảng thời gian của mỗi ca viên, theo lần nộp mới nhất.',
    columns: [
      member,
      count('assigned', 'Được giao'),
      count('passed', 'Đạt'),
      count('needsRevision', 'Cần chỉnh sửa'),
      count('awaitingReview', 'Chờ chấm'),
      count('notSubmitted', 'Chưa nộp'),
    ],
    emptyTitle: 'Chưa có dữ liệu bài tập',
  },
}

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
