import { ApiError, requestFailureMessage } from '@/lib/api/errors'
import { fileExtension, materialExtensions, materialKindLabels, maxMaterialBytes, type MaterialKind } from './types'

/** POST/PUT /api/songs answer 409 SONG_TITLE_DUPLICATE when an active song has the same title and composer. */
export const isDuplicateTitle = (error: Error) => error instanceof ApiError && error.code === 'SONG_TITLE_DUPLICATE'

export const duplicateTitleMessage = 'Kho đã có bài hát cùng tên và cùng nhạc sĩ. Đổi tên bài hoặc ghi rõ nhạc sĩ rồi lưu lại.'

/**
 * PUT /api/songs/{id}/classification: a newly chosen entry or skill was deactivated or deleted meanwhile
 * (400 SONG_CLASSIFICATION_TARGET_INVALID, 409 SKILL_INACTIVE, 404 SKILL_NOT_FOUND). Duplicates and a skill in the
 * wrong list cannot be chosen in the form; a skill moved to the other category meanwhile answers 400
 * SONG_SKILL_REQUIREMENT_CATEGORY_INVALID.
 */
const staleChoiceCodes = new Set([
  'SONG_CLASSIFICATION_TARGET_INVALID',
  'SKILL_INACTIVE',
  'SKILL_NOT_FOUND',
  'SONG_SKILL_REQUIREMENT_CATEGORY_INVALID',
])

/** Checked before uploading, with the backend's rules, so a wrong file is refused without sending 20 MiB. */
export function materialFileProblem(kind: MaterialKind, file: File): string | undefined {
  const accepted = materialExtensions[kind]
  if (!file.name.includes('.') || !accepted.includes(fileExtension(file.name))) {
    return `${materialKindLabels[kind]} chỉ nhận tệp ${accepted.join(', ')}.`
  }
  if (file.size === 0) return 'Tệp rỗng, vui lòng chọn tệp khác.'
  if (file.size > maxMaterialBytes) return 'Tệp vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.'
  return undefined
}

/** MIDI files the backend cannot render for the mobile player (422, BE d394db4); also on replacing a file. */
const midiMessages: Record<string, string> = {
  MIDI_INVALID_FILE: 'Tệp MIDI không hợp lệ. Vui lòng chọn tệp khác.',
  MIDI_FORMAT_UNSUPPORTED: 'Định dạng MIDI này chưa được hỗ trợ. Hãy xuất lại tệp ở định dạng MIDI 0 hoặc 1.',
  MIDI_NO_PLAYABLE_NOTES: 'Tệp MIDI không có nốt nào để phát (chỉ có bộ gõ hoặc trống).',
  MIDI_LIMIT_EXCEEDED: 'Tệp MIDI quá dài hoặc có quá nhiều nốt.',
}

/** POST /api/music-materials (Harmonia-BE doc/api.md, Music materials). */
export function uploadErrorMessage(error: Error): string {
  const code = error instanceof ApiError ? error.code : undefined
  if (code && midiMessages[code]) return midiMessages[code]
  switch (code) {
    case 'MATERIAL_FILE_TYPE_NOT_ALLOWED':
      return 'Định dạng tệp không được hỗ trợ cho loại tài liệu này. Vui lòng chọn tệp đúng định dạng.'
    case 'MATERIAL_FILE_TOO_LARGE':
      return 'Tệp vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.'
    case 'MATERIAL_FILE_REQUIRED':
      return 'Tệp rỗng, vui lòng chọn tệp khác.'
    case 'SKILL_INACTIVE':
    case 'SKILL_NOT_FOUND':
      return 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại. Vui lòng chọn kỹ năng khác.'
    case 'EXTERNAL_STORAGE_FAILED':
      return 'Không thể lưu tệp lúc này. Vui lòng thử lại sau.'
    case 'MATERIAL_LYRICS_SOURCE_INVALID':
      return 'Lời bài hát cần đúng một trong hai: tệp Word (.docx) hoặc lời gõ trực tiếp.'
    default:
      return requestFailureMessage(error, 'Không thể tải lên tài liệu. Vui lòng thử lại.')
  }
}

export function classificationErrorMessage(error: Error): string {
  return error instanceof ApiError && error.code !== undefined && staleChoiceCodes.has(error.code)
    ? 'Một số mục vừa chọn đã bị tắt hoặc không còn tồn tại. Vui lòng tải lại trang rồi chọn lại.'
    : requestFailureMessage(error, 'Không thể lưu phân loại. Vui lòng thử lại.')
}

/** PUT /api/music-materials/{id} (Harmonia-BE MusicMaterialService.UpdateAsync). */
export function materialUpdateErrorMessage(error: Error): string {
  switch (error instanceof ApiError ? error.code : undefined) {
    case 'MATERIAL_NOT_FOUND':
      return 'Tài liệu không còn tồn tại. Vui lòng tải lại trang.'
    case 'SKILL_INACTIVE':
    case 'SKILL_NOT_FOUND':
      return 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại. Vui lòng chọn kỹ năng khác.'
    case 'MATERIAL_LYRICS_SOURCE_INVALID':
      return 'Lời bài hát gõ trực tiếp không được để trống.'
    default:
      return requestFailureMessage(error, 'Không thể lưu tài liệu. Vui lòng thử lại.')
  }
}

/** POST /api/music-materials/{id}/extract-lyrics (Harmonia-BE MusicMaterialService.ExtractLyricsAsync). */
export function extractLyricsErrorMessage(error: Error): string {
  switch (error instanceof ApiError ? error.code : undefined) {
    case 'MATERIAL_NOT_FOUND':
      return 'Bản nhạc không còn tồn tại. Vui lòng tải lại trang.'
    case 'MATERIAL_NOT_SHEET_MUSIC':
      return 'Chỉ trích được lời từ bản nhạc dạng PDF hoặc ảnh.'
    case 'EXTERNAL_AI_FAILED':
      return 'Không đọc được lời từ bản nhạc lúc này. Vui lòng thử lại sau hoặc gõ lời trực tiếp.'
    default:
      return requestFailureMessage(error, 'Không thể trích lời bài hát. Vui lòng thử lại.')
  }
}
