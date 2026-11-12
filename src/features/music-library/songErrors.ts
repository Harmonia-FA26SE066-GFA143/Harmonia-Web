import { ApiError, errorMessage, requestFailureMessage } from '@/lib/api/errors'
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

/**
 * MIDI and MusicXML files the backend cannot render for the mobile player (422, BE d394db4, d550665); also on
 * replacing a file. A score is converted to MIDI first, so the MIDI_* codes can also answer a MusicXML upload.
 */
const midiMessages: Record<string, string> = {
  MIDI_INVALID_FILE: 'Tệp MIDI không hợp lệ. Vui lòng chọn tệp khác.',
  MIDI_FORMAT_UNSUPPORTED: 'Định dạng MIDI này chưa được hỗ trợ. Hãy xuất lại tệp ở định dạng MIDI 0 hoặc 1.',
  MIDI_NO_PLAYABLE_NOTES: 'Tệp không có nốt nào để phát (chỉ có bộ gõ hoặc trống).',
  MIDI_LIMIT_EXCEEDED: 'Tệp quá dài hoặc có quá nhiều nốt.',
  MATERIAL_SCORE_INVALID: 'Tệp MusicXML bị hỏng hoặc không đọc được. Hãy xuất lại tệp .musicxml hoặc .mxl.',
  MATERIAL_SCORE_UNSUPPORTED: 'Bản nhạc MusicXML này chưa phát được (không có bè hoặc không có nốt có cao độ). Hãy xuất lại theo dạng từng bè.',
}

/** PUT and DELETE /api/music-materials/{id}/timed-lyrics (Harmonia-BE d74096c, ErrorStatusMap.cs:105,121-124). */
export const timedLyricsErrorMessage = (error: Error) =>
  errorMessage(
    error,
    {
      VALIDATION_FAILED: 'Có dòng chưa hợp lệ. Vui lòng kiểm tra các dòng lần lượt và không chồng nhau.',
      TIMED_LYRICS_LINES_INVALID: 'Có dòng chưa hợp lệ. Vui lòng kiểm tra các dòng lần lượt và không chồng nhau.',
      TIMED_LYRICS_EXCEEDS_DURATION: 'Dòng cuối kết thúc sau khi âm thanh đã hết. Vui lòng sửa giây kết thúc.',
      TIMED_LYRICS_NOT_FOUND: 'Mốc thời gian đã được xoá trước đó. Vui lòng tải lại trang.',
      MATERIAL_NOT_LYRICS: 'Tài liệu lời đã chọn không còn thuộc bài hát này. Vui lòng chọn tài liệu khác.',
      MATERIAL_NOT_AUDIO: 'Tài liệu này không gắn được lời theo thời gian.',
      MATERIAL_NOT_FOUND: 'Tài liệu không còn tồn tại. Vui lòng tải lại trang.',
    },
    'Không thể lưu mốc thời gian. Vui lòng thử lại.',
  )

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

/** A lyrics extraction job, on start or as its `errorCode` (Harmonia-BE 6c10d65, docs/error-codes.md). */
export function extractLyricsErrorMessage(error: Error): string {
  switch (error instanceof ApiError ? error.code : undefined) {
    case 'MATERIAL_NOT_FOUND':
      return 'Bản nhạc không còn tồn tại. Vui lòng tải lại trang.'
    case 'MATERIAL_NOT_SHEET_MUSIC':
      return 'Chỉ trích được lời từ bản nhạc dạng PDF hoặc ảnh.'
    case 'EXTERNAL_AI_FAILED':
      return 'Không đọc được lời từ bản nhạc lúc này. Vui lòng thử lại sau hoặc gõ lời trực tiếp.'
    case 'LYRICS_EXTRACTION_INTERRUPTED':
      return 'Máy chủ khởi động lại khi đang trích lời. Vui lòng thử lại.'
    case 'LYRICS_EXTRACTION_NOT_FOUND':
      return 'Kết quả trích lời đã hết hạn. Vui lòng trích lại.'
    default:
      return requestFailureMessage(error, 'Không thể trích lời bài hát. Vui lòng thử lại.')
  }
}
