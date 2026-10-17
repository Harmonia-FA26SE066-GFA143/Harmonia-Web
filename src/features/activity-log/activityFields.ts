import { formatDateTime } from '@/lib/api/dates'

// Wording for the values Harmonia-BE writes to the audit log (AuditableEntityInterceptor): entity property names and
// enum names as text. A field or value missing here is shown as the backend wrote it.

const fieldLabels: Record<string, string> = {
  Id: 'Mã bản ghi',
  Email: 'Email',
  FullName: 'Họ và tên',
  Phone: 'Số điện thoại',
  RoleId: 'Vai trò',
  IsActive: 'Đang sử dụng',
  IsPasswordChangeRequired: 'Phải đổi mật khẩu',
  AvatarUrl: 'Ảnh đại diện',
  AvatarPublicId: 'Mã ảnh đại diện',
  Name: 'Tên',
  Description: 'Mô tả',
  Key: 'Khoá cấu hình',
  Value: 'Giá trị',
  DataType: 'Kiểu dữ liệu',
  EventId: 'Sự kiện',
  Version: 'Phiên bản',
  Status: 'Trạng thái',
  ProposedBy: 'Người đề xuất',
  PreviousVersionId: 'Phiên bản trước',
  SubmittedAt: 'Gửi duyệt lúc',
  DecidedAt: 'Quyết định lúc',
  SongListId: 'Danh sách bài hát',
  ReviewerId: 'Người duyệt',
  Decision: 'Quyết định',
  Notes: 'Ghi chú',
  ReviewedAt: 'Duyệt lúc',
  GeneratedAt: 'Gợi ý lúc',
  GeneratedBy: 'Người gợi ý',
  FinalizedAt: 'Chốt lúc',
  FinalizedBy: 'Người chốt',
  RosterId: 'Bảng phân công',
  MemberId: 'Ca viên',
  SkillId: 'Kỹ năng',
  SongListItemId: 'Bài hát trong danh sách',
  Source: 'Nguồn',
  NotifiedAt: 'Đã thông báo lúc',
  ReplacedByAssignmentId: 'Thay bằng dòng phân công',
  Level: 'Trình độ',
  DeclaredAt: 'Khai báo lúc',
  ApprovedBy: 'Người duyệt',
  ApprovedAt: 'Duyệt lúc',
  RejectReason: 'Lý do từ chối',
  EventDate: 'Ngày cử hành',
  LiturgicalSeasonId: 'Mùa phụng vụ',
  Time: 'Giờ',
  MassTypeId: 'Loại Thánh lễ',
  CeremonyTypeId: 'Loại nghi thức',
  LocationId: 'Nơi cử hành',
  Title: 'Tiêu đề',
  SpecialRequirements: 'Yêu cầu đặc biệt',
  PublishedAt: 'Công bố lúc',
  SongId: 'Bài hát',
  MaterialType: 'Loại tài liệu',
  FilePublicId: 'Mã tệp',
  FileName: 'Tên tệp',
  FileSizeBytes: 'Dung lượng (byte)',
  TargetSkillId: 'Dành cho kỹ năng',
  RehearsalId: 'Buổi tập',
  StartDate: 'Ngày bắt đầu',
  EndDate: 'Ngày kết thúc',
  ColorHex: 'Màu',
  DefaultOrder: 'Thứ tự mặc định',
  Address: 'Địa chỉ',
}

/** The same property name means something else on these entity types. */
const fieldLabelsByEntity: Record<string, string> = {
  'Skill.CategoryId': 'Nhóm kỹ năng',
  'LiturgicalEvent.CategoryId': 'Loại sự kiện',
}

// Enum names of SongListStatus, ReviewDecision, RosterStatus, AssignmentSource, RosterAssignmentStatus, SkillLevel,
// ApprovalStatus, EventStatus, MaterialType, AttendanceStatus and SettingDataType.
const enumLabels: Record<string, string> = {
  Draft: 'Bản nháp',
  Submitted: 'Đã gửi duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Bị từ chối',
  NeedsRevision: 'Cần chỉnh sửa',
  Approve: 'Phê duyệt',
  Reject: 'Từ chối',
  RequestRevision: 'Yêu cầu chỉnh sửa',
  Suggested: 'Gợi ý',
  Finalized: 'Đã chốt',
  Manual: 'Chọn tay',
  Active: 'Đang hiệu lực',
  Replaced: 'Đã thay thế',
  Beginner: 'Sơ cấp',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
  Pending: 'Chờ duyệt',
  Published: 'Đã công bố',
  Cancelled: 'Đã hủy',
  SheetMusic: 'Bản nhạc',
  Lyrics: 'Lời bài hát',
  SampleAudio: 'Audio mẫu',
  RehearsalMaterial: 'Tài liệu tập luyện',
  Present: 'Có mặt',
  Absent: 'Vắng',
  Late: 'Đi muộn',
  Excused: 'Vắng có phép',
  String: 'Chuỗi',
  Int: 'Số nguyên',
  Bool: 'Đúng / sai',
  Json: 'JSON',
}

/** Only these fields hold enum names; a name or a note that happens to read "Active" stays as written. */
const enumFields = new Set(['Status', 'Decision', 'Source', 'Level', 'MaterialType', 'DataType'])

const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/
const timeOnly = /^(\d{2}):(\d{2})(:\d{2}(\.\d+)?)?$/
const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

export const fieldLabel = (entityType: string, field: string) =>
  fieldLabelsByEntity[`${entityType}.${field}`] ?? fieldLabels[field] ?? field

/** A logged value as shown in the detail: words for enums and booleans, Vietnam time for timestamps. */
export function fieldValue(field: string, value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (value === null) return '(trống)'
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (typeof value !== 'string') return JSON.stringify(value)
  if (enumFields.has(field)) return enumLabels[value] ?? value
  if (dateTime.test(value)) return formatDateTime(value)
  const date = dateOnly.exec(value)
  if (date) return `${date[3]}/${date[2]}/${date[1]}`
  const time = timeOnly.exec(value)
  if (time && field === 'Time') return `${time[1]}:${time[2]}`
  return value
}
