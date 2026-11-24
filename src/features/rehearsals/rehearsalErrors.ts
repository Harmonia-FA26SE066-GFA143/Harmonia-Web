import { errorMessage } from '@/lib/api/errors'

/** Refusals of `/api/rehearsals` the Choir Director can act on (Harmonia-BE RehearsalService, RehearsalSongService). */
const messages: Record<string, string> = {
  REHEARSAL_NOT_FOUND: 'Buổi tập không còn tồn tại. Lịch tập đã được tải lại.',
  REHEARSAL_ALREADY_PASSED: 'Buổi tập đã kết thúc, không sửa được nữa.',
  REHEARSAL_HAS_ATTENDANCE: 'Buổi tập đã có điểm danh nên không thể xoá.',
  REHEARSAL_TIME_INVALID: 'Giờ kết thúc phải sau giờ bắt đầu.',
  // BE ac4a7bb: a new session cannot start in the past.
  REHEARSAL_START_IN_PAST: 'Giờ bắt đầu phải sau thời điểm hiện tại.',
  REHEARSAL_TIME_CONFLICT: 'Địa điểm đã có buổi tập khác trùng giờ.',
  REHEARSAL_SONG_DUPLICATE: 'Mỗi bài hát chỉ chọn một lần.',
  CHOIR_NOT_FOUND: 'Ca đoàn đã chọn không còn do bạn phụ trách. Vui lòng tải lại trang.',
  CHOIR_INACTIVE: 'Ca đoàn đã chọn đang ngừng hoạt động.',
  CHOIR_NOT_SERVING_EVENT: 'Ca đoàn đã chọn không phục vụ chương trình này.',
  LOOKUP_NOT_FOUND: 'Địa điểm đã chọn không còn tồn tại.',
  LOOKUP_INACTIVE: 'Địa điểm đã chọn đã ngừng dùng.',
  LITURGICAL_EVENT_NOT_FOUND: 'Chương trình đã chọn không còn tồn tại.',
  LITURGICAL_EVENT_CANCELLED: 'Chương trình đã chọn đã bị hủy.',
  SONG_NOT_FOUND: 'Có bài hát đã chọn không còn trong kho.',
  SONG_INACTIVE: 'Có bài hát đã chọn đã bị xoá khỏi kho.',
  // Joint rehearsals (BE 69c9d47): only the lead choir's director plans, changes or records one
  // (CheckCanManageRehearsalAsync), and its program stays. One sentence for scheduling and for the practice room.
  CHOIR_NOT_LEAD: 'Với buổi tập chung, chỉ ca trưởng của ca đoàn phụ trách chương trình mới làm được việc này.',
  REHEARSAL_JOINT_EVENT_LOCKED: 'Buổi tập chung gắn với chương trình đã chọn, không đổi sang chương trình khác được.',
  // Practice-room takes (BE 90af733, B43).
  REHEARSAL_RECORDING_NOT_FOUND: 'Bản thu không còn tồn tại. Danh sách đã được tải lại.',
  REHEARSAL_RECORDING_REQUIRED: 'Bản thu rỗng. Vui lòng thu lại.',
  REHEARSAL_RECORDING_TYPE_NOT_ALLOWED: 'Trình duyệt này ghi âm theo định dạng máy chủ chưa nhận. Hãy thử Chrome, Edge hoặc Firefox.',
  REHEARSAL_RECORDING_TOO_LARGE: 'Bản thu vượt quá 20 MB. Hãy thu đoạn ngắn hơn.',
}

/** The message of the error code, or of the first field error code (400 VALIDATION_FAILED), else `fallback`. */
export function rehearsalErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
