import { ApiError } from '@/lib/api/errors'

/** `/api/users` refusals the Admin can act on (Harmonia-BE UserService, ErrorStatusMap: 404 / 409). */
const messages: Record<string, string> = {
  USER_NOT_FOUND: 'Tài khoản không còn tồn tại. Vui lòng tải lại trang.',
  USER_CANNOT_MODIFY_SELF: 'Bạn không thể đổi vai trò hoặc ngừng hoạt động tài khoản của chính mình.',
  USER_LAST_ADMIN: 'Hệ thống cần ít nhất một Quản trị viên đang hoạt động.',
  USER_ALREADY_ACTIVE: 'Tài khoản đã đang hoạt động.',
  USER_ALREADY_INACTIVE: 'Tài khoản đã ngừng hoạt động.',
}

/** 409 USER_EMAIL_ALREADY_EXISTS on create and update; shown under the email field. */
export const isDuplicateEmail = (error: Error) => error instanceof ApiError && error.code === 'USER_EMAIL_ALREADY_EXISTS'

export const duplicateEmailMessage = 'Email này đã được dùng cho tài khoản khác.'

export function accountErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
