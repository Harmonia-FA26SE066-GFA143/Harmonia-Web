import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { deleteTimedLyrics, getTimedLyrics, saveTimedLyrics } from './api/songsApi'
import { lineEndProblem, lineStartProblem, lineTextProblem, splitLyricsText } from './timedLyricsRules'

afterEach(() => vi.restoreAllMocks())

describe('timed line rules', () => {
  it('needs text within the limit', () => {
    expect(lineTextProblem({ text: '   ' })).toMatch(/nhập lời/)
    expect(lineTextProblem({ text: 'x'.repeat(501) })).toMatch(/500/)
    expect(lineTextProblem({ text: 'Lạy Chúa' })).toBeUndefined()
  })

  it('needs a start at or after the end of the previous line', () => {
    const rows = [{ startSeconds: 0, endSeconds: 5 }, { startSeconds: 4, endSeconds: 6 }]
    expect(lineStartProblem(rows, 1)).toMatch(/5 giây/)
    expect(lineStartProblem([{ startSeconds: 0, endSeconds: 5 }, { startSeconds: 5, endSeconds: 6 }], 1)).toBeUndefined()
    expect(lineStartProblem([{}], 0)).toMatch(/nhập giây bắt đầu/)
  })

  it('needs an end after the start and inside the audio', () => {
    expect(lineEndProblem([{ startSeconds: 3, endSeconds: 3 }], 0, 10)).toMatch(/lớn hơn/)
    expect(lineEndProblem([{ startSeconds: 3, endSeconds: 11 }], 0, 10)).toMatch(/chỉ dài 10/)
    expect(lineEndProblem([{ startSeconds: 3, endSeconds: 11 }], 0, undefined)).toBeUndefined()
  })

  it('takes one line per non-empty row of typed lyrics', () => {
    expect(splitLyricsText('Một\r\n\n  Hai  \n')).toEqual(['Một', 'Hai'])
  })
})

describe('timed lyrics API', () => {
  it('reads "no timing yet" as null, but not a missing material', async () => {
    const request = vi.spyOn(client, 'apiRequest')
    request.mockRejectedValueOnce(new ApiError(404, { code: 'TIMED_LYRICS_NOT_FOUND' }))
    await expect(getTimedLyrics('a1')).resolves.toBeNull()

    request.mockRejectedValueOnce(new ApiError(404, { code: 'MATERIAL_NOT_FOUND' }))
    await expect(getTimedLyrics('a1')).rejects.toBeInstanceOf(ApiError)
  })

  it('sends the whole timing by line and deletes by audio id', async () => {
    const request = vi.spyOn(client, 'apiRequest').mockResolvedValue(undefined)
    const lines = [{ order: 1, text: 'A', startSeconds: 0, endSeconds: 1 }]
    await saveTimedLyrics('a1', { lyricsMaterialId: 'l1', lines })
    expect(request).toHaveBeenCalledWith('/api/music-materials/a1/timed-lyrics', {
      method: 'PUT',
      body: JSON.stringify({ lyricsMaterialId: 'l1', lines, granularity: 'Line' }),
    })

    await deleteTimedLyrics('a1')
    expect(request).toHaveBeenLastCalledWith('/api/music-materials/a1/timed-lyrics', { method: 'DELETE' })
  })
})
