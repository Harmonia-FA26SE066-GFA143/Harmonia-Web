import { ApiError } from '@/lib/api/errors'

/** POST/PUT /api/songs answer 409 SONG_TITLE_DUPLICATE when an active song has the same title and composer. */
export const isDuplicateTitle = (error: Error) => error instanceof ApiError && error.code === 'SONG_TITLE_DUPLICATE'

export const duplicateTitleMessage = 'Kho đã có bài hát cùng tên và cùng nhạc sĩ.'

/**
 * PUT /api/songs/{id}/classification: a newly chosen entry or skill was deactivated or deleted meanwhile
 * (400 SONG_CLASSIFICATION_TARGET_INVALID, 409 SKILL_INACTIVE, 404 SKILL_NOT_FOUND). Duplicates and a skill in the
 * wrong list cannot be chosen in the form.
 */
const staleChoiceCodes = ['SONG_CLASSIFICATION_TARGET_INVALID', 'SKILL_INACTIVE', 'SKILL_NOT_FOUND']

export function classificationErrorMessage(error: Error): string {
  return error instanceof ApiError && error.code !== undefined && staleChoiceCodes.includes(error.code)
    ? 'Một số mục vừa chọn đã bị tắt hoặc không còn tồn tại. Vui lòng tải lại trang rồi chọn lại.'
    : 'Không thể lưu phân loại. Vui lòng thử lại.'
}
