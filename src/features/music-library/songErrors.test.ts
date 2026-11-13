import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { classificationErrorMessage, isDuplicateTitle, materialFileProblem, uploadErrorMessage } from './songErrors'

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name)

describe('materialFileProblem', () => {
  it('accepts a file of an allowed type, case-insensitively', () => {
    expect(materialFileProblem('sheetMusic', file('Kinh.PDF'))).toBeUndefined()
    expect(materialFileProblem('interactiveScore', file('bai.mxl'))).toBeUndefined()
  })

  it('refuses a wrong type or a name without extension', () => {
    expect(materialFileProblem('lyrics', file('loi.pdf'))).toBe('Lời bài hát chỉ nhận tệp .docx.')
    expect(materialFileProblem('lyrics', file('docx'))).toBe('Lời bài hát chỉ nhận tệp .docx.')
  })

  it('refuses an empty or oversized file', () => {
    expect(materialFileProblem('lyrics', file('loi.docx', 0))).toBe('Tệp rỗng, vui lòng chọn tệp khác.')
    const big = file('loi.docx')
    Object.defineProperty(big, 'size', { value: 20 * 1024 * 1024 + 1 })
    expect(materialFileProblem('lyrics', big)).toBe('Tệp vượt quá 20 MB. Vui lòng chọn tệp nhỏ hơn.')
  })
})

describe('upload and classification messages', () => {
  it('maps MIDI and file codes, else the generic failure', () => {
    expect(uploadErrorMessage(new ApiError(422, { code: 'MIDI_NO_PLAYABLE_NOTES' }))).toBe('Tệp không có nốt nào để phát (chỉ có bộ gõ hoặc trống).')
    expect(uploadErrorMessage(new ApiError(409, { code: 'SKILL_NOT_FOUND' }))).toContain('Kỹ năng đã chọn')
    expect(uploadErrorMessage(new ApiError(400, { code: 'UNKNOWN' }))).toBe('Không thể tải lên tài liệu. Vui lòng thử lại.')
  })

  it('names stale choices on classification', () => {
    expect(classificationErrorMessage(new ApiError(409, { code: 'SKILL_INACTIVE' }))).toContain('đã bị tắt')
    expect(classificationErrorMessage(new ApiError(400, { code: 'OTHER' }))).toBe('Không thể lưu phân loại. Vui lòng thử lại.')
  })

  it('recognises a duplicate title', () => {
    expect(isDuplicateTitle(new ApiError(409, { code: 'SONG_TITLE_DUPLICATE' }))).toBe(true)
    expect(isDuplicateTitle(new Error('x'))).toBe(false)
  })
})
