import { ApiError } from '@/lib/api/errors'

/**
 * The declaration is gone or another Choir Director decided it first (Harmonia-BE MemberSkillService, ErrorStatusMap:
 * 404 / 409). The list is reloaded, so the message says so.
 */
const staleMessages: Record<string, string> = {
  MEMBER_SKILL_NOT_FOUND: 'Khai báo này không còn tồn tại. Danh sách đã được tải lại.',
  MEMBER_SKILL_ALREADY_REVIEWED: 'Khai báo này đã được Ca trưởng khác xử lý. Danh sách đã được tải lại.',
}

export const isStaleReview = (error: Error) =>
  error instanceof ApiError && error.code !== undefined && error.code in staleMessages

export function reviewErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && staleMessages[error.code]) || fallback
}
