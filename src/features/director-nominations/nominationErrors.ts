import { errorMessage } from '@/lib/api/errors'

/** Refusals of `/api/director-nominations` (Harmonia-BE d74096c, ErrorStatusMap.cs:243-252). */
const messages: Record<string, string> = {
  VALIDATION_FAILED: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các ô.',
  FORBIDDEN: 'Chỉ người tạo đề cử mới rút được. Cha xứ có thể từ chối đề cử này.',
  MEMBER_NOT_FOUND: 'Không tìm thấy ca viên trong các ca đoàn bạn phụ trách.',
  MEMBER_NOT_ACTIVE: 'Ca viên hoặc tài khoản của ca viên đang không hoạt động nên chưa đề cử được.',
  CHOIR_NOT_FOUND: 'Ca đoàn đã chọn không còn tồn tại. Vui lòng chọn ca đoàn khác.',
  CHOIR_INACTIVE: 'Ca đoàn đã chọn đang ngừng hoạt động. Vui lòng chọn ca đoàn khác.',
  DIRECTOR_NOMINATION_NOT_FOUND: 'Đề cử không còn tồn tại hoặc bạn không có quyền xem.',
  DIRECTOR_NOMINATION_ALREADY_OPEN: 'Ca viên này đang có một đề cử chưa kết thúc.',
  DIRECTOR_NOMINATION_INVALID_STATUS: 'Đề cử vừa đổi trạng thái nên thao tác này không còn hợp lệ. Vui lòng xem lại đề cử.',
  DIRECTOR_NOMINATION_NOTE_REQUIRED: 'Vui lòng nhập lý do.',
  DIRECTOR_TRAINING_NOT_FOUND: 'Khoá học không còn tồn tại. Vui lòng xem lại đề cử.',
  DIRECTOR_TRAINING_IN_PROGRESS: 'Đề cử đang có một khoá học chưa có kết quả. Vui lòng ghi kết quả trước.',
  DIRECTOR_TRAINING_ALREADY_RECORDED: 'Khoá học đã có kết quả nên không đổi hoặc xoá được.',
  DIRECTOR_TRAINING_CERTIFICATE_REQUIRED: 'Vui lòng chọn tệp chứng chỉ.',
  DIRECTOR_TRAINING_CERTIFICATE_TYPE_NOT_ALLOWED: 'Chứng chỉ chỉ nhận tệp .pdf, .jpg, .png.',
  DIRECTOR_TRAINING_CERTIFICATE_TOO_LARGE: 'Tệp chứng chỉ vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.',
  EXTERNAL_STORAGE_FAILED: 'Kho tệp đang lỗi nên chưa lưu được. Vui lòng thử lại sau.',
}

export const nominationErrorMessage = (error: Error, fallback: string) => errorMessage(error, messages, fallback)
