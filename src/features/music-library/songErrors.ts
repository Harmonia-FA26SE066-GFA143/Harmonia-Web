import { ApiError } from '@/lib/api/errors'
import { materialExtensions, materialKindLabels, maxMaterialBytes, type MaterialKind } from './types'

/** POST/PUT /api/songs answer 409 SONG_TITLE_DUPLICATE when an active song has the same title and composer. */
export const isDuplicateTitle = (error: Error) => error instanceof ApiError && error.code === 'SONG_TITLE_DUPLICATE'

export const duplicateTitleMessage = 'Kho đã có bài hát cùng tên và cùng nhạc sĩ.'

/**
 * PUT /api/songs/{id}/classification: a newly chosen entry or skill was deactivated or deleted meanwhile
 * (400 SONG_CLASSIFICATION_TARGET_INVALID, 409 SKILL_INACTIVE, 404 SKILL_NOT_FOUND). Duplicates and a skill in the
 * wrong list cannot be chosen in the form.
 */
const staleChoiceCodes = ['SONG_CLASSIFICATION_TARGET_INVALID', 'SKILL_INACTIVE', 'SKILL_NOT_FOUND']

const extensionOf = (name: string) => name.slice(name.lastIndexOf('.')).toLowerCase()

/** Checked before uploading, with the backend's rules, so a wrong file is refused without sending 20 MiB. */
export function materialFileProblem(kind: MaterialKind, file: File): string | undefined {
  const accepted = materialExtensions[kind]
  if (!file.name.includes('.') || !accepted.includes(extensionOf(file.name))) {
    return `${materialKindLabels[kind]} chỉ nhận tệp ${accepted.join(', ')}.`
  }
  if (file.size === 0) return 'Tệp rỗng, vui lòng chọn tệp khác.'
  if (file.size > maxMaterialBytes) return 'Tệp vượt quá 20 MB.'
  return undefined
}

/** POST /api/music-materials (Harmonia-BE doc/api.md, Music materials). */
export function uploadErrorMessage(error: Error): string {
  switch (error instanceof ApiError ? error.code : undefined) {
    case 'MATERIAL_FILE_TYPE_NOT_ALLOWED':
      return 'Định dạng tệp không được hỗ trợ cho loại tài liệu này.'
    case 'MATERIAL_FILE_TOO_LARGE':
      return 'Tệp vượt quá 20 MB.'
    case 'MATERIAL_FILE_REQUIRED':
      return 'Tệp rỗng, vui lòng chọn tệp khác.'
    case 'SKILL_INACTIVE':
    case 'SKILL_NOT_FOUND':
      return 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại.'
    case 'EXTERNAL_STORAGE_FAILED':
      return 'Không thể lưu tệp lúc này. Vui lòng thử lại sau.'
    default:
      return 'Không thể tải lên tài liệu. Vui lòng thử lại.'
  }
}

export function classificationErrorMessage(error: Error): string {
  return error instanceof ApiError && error.code !== undefined && staleChoiceCodes.includes(error.code)
    ? 'Một số mục vừa chọn đã bị tắt hoặc không còn tồn tại. Vui lòng tải lại trang rồi chọn lại.'
    : 'Không thể lưu phân loại. Vui lòng thử lại.'
}

/** PUT /api/music-materials/{id} (Harmonia-BE MusicMaterialService.UpdateAsync). */
export function materialUpdateErrorMessage(error: Error): string {
  switch (error instanceof ApiError ? error.code : undefined) {
    case 'MATERIAL_NOT_FOUND':
      return 'Tài liệu không còn tồn tại. Vui lòng tải lại trang.'
    case 'SKILL_INACTIVE':
    case 'SKILL_NOT_FOUND':
      return 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại.'
    default:
      return 'Không thể lưu tài liệu. Vui lòng thử lại.'
  }
}
