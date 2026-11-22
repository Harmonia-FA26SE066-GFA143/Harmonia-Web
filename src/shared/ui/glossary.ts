/**
 * Canonical Vietnamese Terminology Glossary (R4.2, `02-ux-architecture.md` §6).
 * One concept has one authoritative term across navigation, headings, buttons, drawers, tables, filters, and copy.
 * Tone marks follow the spelling already used across `src/`: "Xoá" (not "Xóa") and "Hủy" (not "Huỷ").
 */

export const MATERIAL_LABELS = {
  sheetMusic: 'Bản nhạc',
  lyrics: 'Lời bài hát',
  sampleAudio: 'Audio mẫu',
  rehearsalMaterial: 'Tài liệu tập luyện',
  interactiveScore: 'Bản nhạc tương tác',
} as const

export const PROGRAM_NOUN = 'Chương trình phụng vụ'
export const PROGRAM_NOUN_SHORT = 'Chương trình'
export const MASS_NOUN = 'Thánh lễ'

export const CHOIR_NAV_LABEL = 'Quản lý ca đoàn'
export const CHOIR_SWITCHER_PREFIX = 'Ca đoàn:'
export const CHOIR_ALL_LABEL = 'Tất cả ca đoàn'

export const CREATE_REHEARSAL_LABEL = 'Thêm buổi tập'
export const PRACTICE_ROOM_TITLE = 'Phòng luyện tập'
export const PRACTICE_ROOM_ACTION = 'Vào phòng tập'
export const PRACTICE_AREA_LABEL = 'Luyện tập'
export const CREATE_ASSIGNMENT_LABEL = 'Giao bài tập'
export const PRACTICE_REVIEW_TAB_LABEL = 'Cần chấm'
export const PRACTICE_ASSIGNMENTS_TAB_LABEL = 'Bài tập đã giao'
export const PRACTICE_READINESS_TAB_LABEL = 'Tiến độ chuẩn bị'

export const ATTENDANCE_LATE_LABEL = 'Đi trễ'
export const VIEW_MEMBER_ACTION = 'Xem hồ sơ'
export const VIEW_MEMBER_DRAWER_TITLE = 'Hồ sơ ca viên'
export const EDIT_MEMBER_ACTION = 'Chỉnh sửa hồ sơ'

export const UNASSIGNED_VOICE_LABEL = 'Chưa phân bè'
export const MISSING_FIELD_LABEL = 'Chưa cập nhật'
export const MISSING_FILE_LABEL = 'Chưa có'
export const UNKNOWN_METRIC_LABEL = 'Chưa có dữ liệu'

export const FILTER_ALL_PREFIX = 'Tất cả'
export const FILTER_RESET_LABEL = 'Xoá bộ lọc'
export const LOADING_COUNT_LABEL = 'Đang tải…'
export const ACTIONS_COLUMN_TITLE = 'Thao tác'
export const CANCEL_LABEL = 'Hủy'
export const CLOSE_LABEL = 'Đóng'

/** Result-count status text (R2.5): the count once known, an error line if the query failed, otherwise "Đang tải…". */
export function resultCountLabel(resultCount: number | undefined, noun: string, error = false): string {
  if (resultCount !== undefined) return `${resultCount} ${noun}`
  return error ? 'Không thể tải số liệu' : LOADING_COUNT_LABEL
}

/** Builds canonical "Tất cả [danh mục]" placeholder text for filter selects. */
export function filterAllPlaceholder(categoryNoun: string): string {
  return `${FILTER_ALL_PREFIX} ${categoryNoun}`
}
