import { ApiError } from '@/lib/api/errors'

const codeOf = (error: Error) => (error instanceof ApiError ? error.code : undefined)

/** 409 on POST / PUT /api/lookups/*: the name is taken, switched-off entries included (Harmonia-BE LookupService). */
const nameConflicts: Record<string, string> = {
  LOOKUP_NAME_DUPLICATE: 'Tên này đã có trong danh mục, kể cả mục đã ngừng dùng.',
  SKILL_NAME_DUPLICATE: 'Nhóm kỹ năng này đã có kỹ năng cùng tên, kể cả kỹ năng đã ngừng dùng.',
}

/** Shown under the name field, or `undefined` when the error is about something else. */
export const nameConflictMessage = (error: Error): string | undefined => nameConflicts[codeOf(error) ?? '']

/** Other refusals the Admin can act on (ErrorStatusMap: 404 / 409). */
const messages: Record<string, string> = {
  LOOKUP_NOT_FOUND: 'Mục này không còn tồn tại. Vui lòng tải lại trang.',
  SKILL_NOT_FOUND: 'Kỹ năng này không còn tồn tại. Vui lòng tải lại trang.',
  SKILL_CATEGORY_NOT_FOUND: 'Nhóm kỹ năng đã chọn không còn tồn tại. Vui lòng tải lại trang.',
  SEASON_DATE_OVERLAP: 'Khoảng ngày này trùng với một mùa phụng vụ khác đang dùng.',
}

export function catalogErrorMessage(error: Error, fallback: string): string {
  return messages[codeOf(error) ?? ''] ?? fallback
}
