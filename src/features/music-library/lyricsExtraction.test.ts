import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import * as songsApi from './api/songsApi'
import { LyricsExtractionPending, runLyricsExtraction, wasSeen } from './lyricsExtraction'

const job = (status: songsApi.LyricsExtractionJob['status'], extra: Partial<songsApi.LyricsExtractionJob> = {}) => ({
  id: 'j1', status, lyricsText: null, errorCode: null, ...extra,
})

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('runLyricsExtraction', () => {
  it('polls the job until it succeeds and remembers it was handed over', async () => {
    vi.spyOn(songsApi, 'startLyricsExtraction').mockResolvedValue(job('Queued'))
    const get = vi.spyOn(songsApi, 'getLyricsExtraction')
      .mockResolvedValueOnce(job('Running'))
      .mockResolvedValueOnce(job('Succeeded', { lyricsText: 'Lạy Chúa' }))

    const result = runLyricsExtraction('m1', () => true)
    await vi.advanceTimersByTimeAsync(6000)

    await expect(result).resolves.toBe('Lạy Chúa')
    expect(get).toHaveBeenCalledTimes(2)
    expect(wasSeen('j1')).toBe(true)
  })

  it('follows a known job instead of starting one', async () => {
    const start = vi.spyOn(songsApi, 'startLyricsExtraction')
    vi.spyOn(songsApi, 'getLyricsExtraction').mockResolvedValue(job('Succeeded', { lyricsText: 'x' }))

    await expect(runLyricsExtraction('m1', () => true, 'j1')).resolves.toBe('x')
    expect(start).not.toHaveBeenCalled()
  })

  it('throws the job error code', async () => {
    vi.spyOn(songsApi, 'startLyricsExtraction').mockResolvedValue(job('Failed', { errorCode: 'EXTERNAL_AI_FAILED' }))

    const error = await runLyricsExtraction('m1', () => true).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('EXTERNAL_AI_FAILED')
  })

  it('stops polling when the session ends, and gives up after a long wait', async () => {
    vi.spyOn(songsApi, 'startLyricsExtraction').mockResolvedValue(job('Running'))
    const get = vi.spyOn(songsApi, 'getLyricsExtraction').mockResolvedValue(job('Running'))

    await expect(runLyricsExtraction('m1', () => false)).rejects.toThrow('Session ended')
    expect(get).not.toHaveBeenCalled()

    const slow = runLyricsExtraction('m1', () => true).catch((caught: unknown) => caught)
    await vi.advanceTimersByTimeAsync(16 * 60 * 1000)
    expect(await slow).toBeInstanceOf(LyricsExtractionPending)
  })
})
