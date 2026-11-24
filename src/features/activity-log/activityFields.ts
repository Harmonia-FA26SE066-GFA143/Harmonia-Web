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
  ScoreRevision: 'Phiên bản bản nhạc',
  ScoreSha256: 'Mã băm bản nhạc (SHA-256)',
  PlaybackAudioSha256: 'Mã băm audio phát (SHA-256)',
  TargetSkillId: 'Dành cho kỹ năng',
  RehearsalId: 'Buổi tập',
  StartDate: 'Ngày bắt đầu',
  EndDate: 'Ngày kết thúc',
  ColorHex: 'Màu',
  DefaultOrder: 'Thứ tự mặc định',
  Address: 'Địa chỉ',
  SaintName: 'Tên thánh',
  Gender: 'Giới tính',
  RevokedAt: 'Thu hồi lúc',
  RevokeReason: 'Lý do thu hồi',
  ChoirId: 'Ca đoàn',
  IsLead: 'Phụ trách chính',
  SubstituteDirectorId: 'Ca trưởng thay thế',
  Reason: 'Lý do',
  NominatedById: 'Người đề cử',
  ProposedChoirId: 'Ca đoàn dự kiến',
  ReviewNote: 'Ghi chú xem xét',
  TrainingWaiverReason: 'Lý do miễn đào tạo',
  AppointedChoirId: 'Ca đoàn bổ nhiệm',
  AppointedAt: 'Bổ nhiệm lúc',
  NominationId: 'Hồ sơ đề cử',
  CourseName: 'Khoá đào tạo',
  Organizer: 'Đơn vị tổ chức',
  Result: 'Kết quả',
  ResultNote: 'Nhận xét kết quả',
  CertificateFileName: 'Tên tệp chứng chỉ',
  CertificatePublicId: 'Mã tệp chứng chỉ',
  ParentId: 'Chủ đề cha',
  RequiredCount: 'Số người cần',
  WholeServiceFinalizedAt: 'Chốt vị trí toàn buổi lúc',
  Note: 'Ghi chú',
  RevokedBy: 'Người thu hồi',
  EvidencePublicId: 'Mã tệp minh chứng',
  EvidenceFileName: 'Tên tệp minh chứng',
  EvidenceSizeBytes: 'Dung lượng minh chứng (byte)',
  EvidenceUploadedAt: 'Tải minh chứng lúc',
  ReviewedById: 'Người xem xét',
  ResultRecordedAt: 'Ghi kết quả lúc',
  CertificateSizeBytes: 'Dung lượng chứng chỉ (byte)',
  LyricsText: 'Lời bài hát',
  FileRevision: 'Phiên bản tệp',
  AudioDurationSeconds: 'Thời lượng audio (giây)',
  PlaybackAudioPublicId: 'Mã tệp audio phát',
  PlaybackNotesPublicId: 'Mã tệp nốt phát',
  PlaybackDurationSeconds: 'Thời lượng bản phát (giây)',
  PlaybackInstrument: 'Nhạc cụ phát',
  TimedLyrics: 'Lời theo thời gian',
  CalendarKey: 'Theo mùa của lịch phụng vụ',
  SlotId: 'Phần phụng vụ',
}

/** The same property name means something else on these entity types. */
const fieldLabelsByEntity: Record<string, string> = {
  'Skill.CategoryId': 'Nhóm kỹ năng',
  'LiturgicalEvent.CategoryId': 'Loại sự kiện',
}

// Enum names of SongListStatus, ReviewDecision, RosterStatus, AssignmentSource, RosterAssignmentStatus, SkillLevel,
// ApprovalStatus, EventStatus, MaterialType, AttendanceStatus, SettingDataType, DirectorNominationStatus, DirectorTrainingResult,
// Gender and PlaybackInstrument.
const enumLabels: Record<string, string> = {
  Draft: 'Bản nháp',
  Submitted: 'Đã gửi duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Bị từ chối',
  Revoked: 'Đã thu hồi',
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
  InTraining: 'Đang đào tạo',
  Trained: 'Đã hoàn tất đào tạo',
  Appointed: 'Đã bổ nhiệm',
  InProgress: 'Đang học',
  Passed: 'Đạt',
  Failed: 'Không đạt',
  Male: 'Nam',
  Female: 'Nữ',
  Piano: 'Piano',
  Organ: 'Đàn organ',
  Guitar: 'Guitar',
  StringEnsemble: 'Dàn dây',
  Published: 'Đã công bố',
  Cancelled: 'Đã hủy',
  SheetMusic: 'Bản nhạc',
  Lyrics: 'Lời bài hát',
  SampleAudio: 'Audio mẫu',
  RehearsalMaterial: 'Tài liệu tập luyện',
  InteractiveScore: 'Bản nhạc tương tác',
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
const enumFields = new Set(['Status', 'Decision', 'Source', 'Level', 'MaterialType', 'DataType', 'Result', 'Gender', 'PlaybackInstrument'])

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
