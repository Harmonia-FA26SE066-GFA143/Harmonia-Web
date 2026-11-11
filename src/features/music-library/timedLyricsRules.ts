// The rules of Harmonia-BE UpdateTimedLyricsRequestValidator.cs:10-32 and MusicMaterialService.UpdateTimedLyricsAsync
// (BE d74096c), said per field so a row can show what to fix. The server still decides.

export const MAX_TIMED_LINES = 500
export const MAX_TIMED_LINE_LENGTH = 500

export interface TimedLineRow {
  text?: string
  startSeconds?: number | null
  endSeconds?: number | null
}

const seconds = (value: number) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })

export function lineTextProblem(row: TimedLineRow): string | undefined {
  const text = row.text?.trim() ?? ''
  if (!text) return 'Vui lòng nhập lời của dòng này.'
  if (text.length > MAX_TIMED_LINE_LENGTH) return `Vui lòng rút dòng này còn tối đa ${MAX_TIMED_LINE_LENGTH} ký tự.`
  return undefined
}

export function lineStartProblem(rows: TimedLineRow[], index: number): string | undefined {
  const start = rows[index]?.startSeconds
  if (start === undefined || start === null) return 'Vui lòng nhập giây bắt đầu.'
  if (start < 0) return 'Giây bắt đầu cần từ 0 trở lên.'
  const previousEnd = rows[index - 1]?.endSeconds
  if (previousEnd !== undefined && previousEnd !== null && start < previousEnd) {
    return `Vui lòng bắt đầu từ ${seconds(previousEnd)} giây, lúc dòng trước kết thúc.`
  }
  return undefined
}

export function lineEndProblem(rows: TimedLineRow[], index: number, audioSeconds: number | undefined): string | undefined {
  const { startSeconds: start, endSeconds: end } = rows[index] ?? {}
  if (end === undefined || end === null) return 'Vui lòng nhập giây kết thúc.'
  if (start !== undefined && start !== null && end <= start) return 'Giây kết thúc cần lớn hơn giây bắt đầu.'
  if (audioSeconds && end > audioSeconds) return `Âm thanh chỉ dài ${seconds(audioSeconds)} giây.`
  return undefined
}

/**
 * Where the audio is among sorted, non-overlapping lines, as one number so a change of either part is one state change:
 * `index * 2` before line `index` starts, `index * 2 + 1` while it sounds, -1 past the last line.
 */
export function timedLinePhase(lines: readonly { startSeconds: number; endSeconds: number }[], seconds: number): number {
  const index = lines.findIndex((line) => seconds < line.endSeconds)
  if (index < 0) return -1
  return index * 2 + (seconds >= lines[index].startSeconds ? 1 : 0)
}

/** The non-empty lines of typed lyrics, one timed line each. */
export const splitLyricsText = (text: string) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
