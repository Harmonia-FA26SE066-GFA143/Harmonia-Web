import { ApiError, errorMessage } from '@/lib/api/errors'
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
const staleChoiceMessage = 'Một số mục vừa chọn đã bị tắt hoặc không còn tồn tại. Vui lòng tải lại trang rồi chọn lại.'

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
export const uploadErrorMessage = (error: Error): string =>
  errorMessage(
    error,
    {
      ...midiMessages,
      MATERIAL_FILE_TYPE_NOT_ALLOWED: 'Định dạng tệp không được hỗ trợ cho loại tài liệu này. Vui lòng chọn tệp đúng định dạng.',
      MATERIAL_FILE_TOO_LARGE: 'Tệp vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.',
      MATERIAL_FILE_REQUIRED: 'Tệp rỗng, vui lòng chọn tệp khác.',
      // The length of a recorded .mp3 / .m4a / .wav could not be read (MusicMaterialService.ReadAudioDuration).
      MATERIAL_AUDIO_INVALID: 'Không đọc được tệp audio này, có thể tệp bị hỏng. Vui lòng xuất lại tệp hoặc chọn tệp khác.',
      SKILL_INACTIVE: 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại. Vui lòng chọn kỹ năng khác.',
      SKILL_NOT_FOUND: 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại. Vui lòng chọn kỹ năng khác.',
      EXTERNAL_STORAGE_FAILED: 'Không thể lưu tệp lúc này. Vui lòng thử lại sau.',
      MATERIAL_LYRICS_SOURCE_INVALID: 'Lời bài hát cần đúng một trong hai: tệp Word (.docx) hoặc lời gõ trực tiếp.',
    },
    'Không thể tải lên tài liệu. Vui lòng thử lại.',
  )

export const classificationErrorMessage = (error: Error): string =>
  errorMessage(
    error,
    {
      SONG_CLASSIFICATION_TARGET_INVALID: staleChoiceMessage,
      SKILL_INACTIVE: staleChoiceMessage,
      SKILL_NOT_FOUND: staleChoiceMessage,
      SONG_SKILL_REQUIREMENT_CATEGORY_INVALID: staleChoiceMessage,
    },
    'Không thể lưu phân loại. Vui lòng thử lại.',
  )

/** PUT /api/music-materials/{id} (Harmonia-BE MusicMaterialService.UpdateAsync). */
export const materialUpdateErrorMessage = (error: Error): string =>
  errorMessage(
    error,
    {
      MATERIAL_NOT_FOUND: 'Tài liệu không còn tồn tại. Vui lòng tải lại trang.',
      SKILL_INACTIVE: 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại. Vui lòng chọn kỹ năng khác.',
      SKILL_NOT_FOUND: 'Kỹ năng đã chọn đã bị tắt hoặc không còn tồn tại. Vui lòng chọn kỹ năng khác.',
      MATERIAL_LYRICS_SOURCE_INVALID: 'Lời bài hát gõ trực tiếp không được để trống.',
    },
    'Không thể lưu tài liệu. Vui lòng thử lại.',
  )

/** A lyrics extraction job, on start or as its `errorCode` (Harmonia-BE 6c10d65, docs/error-codes.md). */
export const extractLyricsErrorMessage = (error: Error): string =>
  errorMessage(
    error,
    {
      MATERIAL_NOT_FOUND: 'Bản nhạc không còn tồn tại. Vui lòng tải lại trang.',
      MATERIAL_NOT_SHEET_MUSIC: 'Chỉ trích được lời từ bản nhạc dạng PDF hoặc ảnh.',
      EXTERNAL_AI_FAILED: 'Không đọc được lời từ bản nhạc lúc này. Vui lòng thử lại sau hoặc gõ lời trực tiếp.',
      LYRICS_EXTRACTION_INTERRUPTED: 'Máy chủ khởi động lại khi đang trích lời. Vui lòng thử lại.',
      LYRICS_EXTRACTION_NOT_FOUND: 'Kết quả trích lời đã hết hạn. Vui lòng trích lại.',
    },
    'Không thể trích lời bài hát. Vui lòng thử lại.',
  )
