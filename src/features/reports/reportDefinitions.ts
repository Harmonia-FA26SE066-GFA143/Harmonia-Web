import type { AdminReportKind, PriestReportKind, ReportKind } from './types'

export interface ReportMetricDefinition {
  key: string
  label: string
}

export interface ReportColumnDefinition {
  key: string
  title: string
  /** Dates and times use the numeric font. */
  numeric?: boolean
}

export interface ReportDefinition {
  label: string
  description: string
  /** Summary counts. Labels follow Stitch; definitions are UNRESOLVED (TBD with the business owner). */
  metrics: ReportMetricDefinition[]
  columns: ReportColumnDefinition[]
  emptyTitle: string
}

const member: ReportColumnDefinition = { key: 'member', title: 'Thành viên' }
const event: ReportColumnDefinition = { key: 'event', title: 'Sự kiện' }
const program: ReportColumnDefinition = { key: 'program', title: 'Chương trình' }
const season: ReportColumnDefinition = { key: 'season', title: 'Mùa phụng vụ' }
const celebrationDate: ReportColumnDefinition = { key: 'date', title: 'Ngày cử hành', numeric: true }

export const reportDefinitions: Record<ReportKind, ReportDefinition> = {
  rehearsalAttendance: {
    label: 'Điểm danh',
    description: 'Có mặt thực tế tại buổi tập hoặc buổi phục vụ, khác với xác nhận tham gia trước sự kiện.',
    metrics: [
      { key: 'total', label: 'Tổng lượt điểm danh' },
      { key: 'present', label: 'Có mặt' },
      { key: 'absent', label: 'Vắng mặt' },
      { key: 'notRecorded', label: 'Chưa điểm danh' },
    ],
    columns: [member, event, season, { key: 'recordedAt', title: 'Thời điểm', numeric: true }, { key: 'status', title: 'Điểm danh' }],
    emptyTitle: 'Chưa có dữ liệu điểm danh',
  },
  userActivity: {
    label: 'Hoạt động người dùng',
    description: 'Thao tác của người dùng trong hệ thống.',
    metrics: [{ key: 'total', label: 'Tổng số thao tác' }],
    columns: [
      { key: 'occurredAt', title: 'Thời gian', numeric: true },
      { key: 'actor', title: 'Người thực hiện' },
      { key: 'action', title: 'Hoạt động' },
      { key: 'target', title: 'Đối tượng' },
    ],
    emptyTitle: 'Chưa có dữ liệu hoạt động',
  },
  participation: {
    label: 'Xác nhận tham gia',
    description: 'Phản hồi của thành viên trước sự kiện: xác nhận, từ chối hoặc chưa chắc chắn.',
    metrics: [
      { key: 'requests', label: 'Yêu cầu đã gửi' },
      { key: 'confirmed', label: 'Xác nhận tham gia' },
      { key: 'declined', label: 'Từ chối tham gia' },
      { key: 'unsure', label: 'Chưa chắc chắn' },
      { key: 'noResponse', label: 'Chưa phản hồi' },
    ],
    columns: [member, event, celebrationDate, { key: 'response', title: 'Phản hồi' }, { key: 'note', title: 'Ghi chú' }],
    emptyTitle: 'Chưa có dữ liệu xác nhận tham gia',
  },
  assignmentCompletion: {
    label: 'Hoàn thành bài tập',
    description: 'Tiến độ nộp và đánh giá bài tập luyện tập.',
    metrics: [
      { key: 'assigned', label: 'Bài tập được giao' },
      { key: 'passed', label: 'Đạt' },
      { key: 'needsRevision', label: 'Cần chỉnh sửa' },
      { key: 'awaitingReview', label: 'Chờ đánh giá' },
      { key: 'overdue', label: 'Quá hạn' },
    ],
    columns: [
      member,
      { key: 'assignment', title: 'Bài tập' },
      { key: 'song', title: 'Bài hát' },
      { key: 'status', title: 'Trạng thái' },
      { key: 'submittedAt', title: 'Thời điểm nộp', numeric: true },
    ],
    emptyTitle: 'Chưa có dữ liệu bài tập',
  },
  serviceHistory: {
    label: 'Lịch sử phục vụ',
    description: 'Các chương trình phụng vụ ca đoàn đã phục vụ.',
    metrics: [],
    columns: [
      program,
      celebrationDate,
      season,
      { key: 'massType', title: 'Loại Thánh lễ' },
      { key: 'ceremonyType', title: 'Loại nghi thức' },
    ],
    emptyTitle: 'Chưa có lịch sử phục vụ',
  },
  songUsage: {
    label: 'Sử dụng bài hát',
    description: 'Bài hát đã được dùng trong các chương trình phụng vụ.',
    metrics: [],
    columns: [
      { key: 'song', title: 'Bài hát' },
      { key: 'liturgicalPart', title: 'Phần phụng vụ' },
      program,
      { key: 'date', title: 'Ngày sử dụng', numeric: true },
    ],
    emptyTitle: 'Chưa có dữ liệu sử dụng bài hát',
  },
  eventPreparation: {
    label: 'Tình trạng chuẩn bị',
    description: 'Tình trạng chuẩn bị của ca đoàn cho các sự kiện sắp tới.',
    metrics: [],
    // "Trạng thái công bố" from Stitch is not shown: the report contract is TBD (event status is BE `EventStatus`).
    columns: [program, celebrationDate, { key: 'preparation', title: 'Tình trạng chuẩn bị' }],
    emptyTitle: 'Chưa có sự kiện cần chuẩn bị',
  },
}

export const adminReportKinds: AdminReportKind[] = ['rehearsalAttendance', 'userActivity', 'participation', 'assignmentCompletion']
export const priestReportKinds: PriestReportKind[] = ['serviceHistory', 'songUsage', 'eventPreparation']
