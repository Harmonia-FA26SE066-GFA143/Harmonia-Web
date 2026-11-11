import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as library from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import { ApiScoreSource } from './ApiScoreSource'

vi.mock('@/features/music-library', () => ({ getInteractiveScore: vi.fn() }))

const sha = (text: string) => createHash('sha256').update(text).digest('hex')
const files: Record<string, string> = {
  'https://f/score': '<score-partwise/>',
  'https://f/audio': 'RIFF-audio',
  'https://f/notes': JSON.stringify({ notesEndSeconds: 180.4 }),
}
const answer = (overrides = {}) => ({
  id: 'm1',
  revision: 2,
  scoreFormat: 'musicxml' as const,
  fileName: 'bai.musicxml',
  scoreUrl: 'https://f/score',
  scoreSha256: sha(files['https://f/score']),
  audioUrl: 'https://f/audio',
  audioSha256: sha(files['https://f/audio']),
  notesUrl: 'https://f/notes',
  notesSha256: sha(files['https://f/notes']),
  durationSeconds: 182.4,
  ...overrides,
})
const getScore = vi.mocked(library.getInteractiveScore)
const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockImplementation(async (url: string) => ({ ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(files[url]).buffer }))
  vi.stubGlobal('fetch', fetchMock)
  URL.createObjectURL = vi.fn(() => 'blob:audio')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

describe('ApiScoreSource', () => {
  it('hands the player the files of one revision and drops the signed audio link', async () => {
    getScore.mockResolvedValue(answer())
    const result = await new ApiScoreSource('m1').load()

    expect(result.score).toMatchObject({ format: 'musicxml', fileName: 'bai.musicxml' })
    expect(result.audioUrl).toBe('blob:audio')
    expect(result.notesEndSeconds).toBe(180.4)
    result.dispose()
    result.dispose()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })

  it('asks the API again when a link has expired', async () => {
    getScore.mockResolvedValue(answer())
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 })

    await expect(new ApiScoreSource('m1').load()).resolves.toMatchObject({ audioUrl: 'blob:audio' })
    expect(getScore).toHaveBeenCalledTimes(2)
  })

  it('refuses files that do not match the hashes, after one fresh try', async () => {
    getScore.mockResolvedValue(answer({ audioSha256: 'not-the-hash' }))

    await expect(new ApiScoreSource('m1').load()).rejects.toMatchObject({ code: 'read-failed' })
    expect(getScore).toHaveBeenCalledTimes(2)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('skips the notes check for a score saved before hashes were kept', async () => {
    getScore.mockResolvedValue(answer({ notesSha256: null }))
    await expect(new ApiScoreSource('m1').load()).resolves.toBeDefined()
  })

  it.each(['MATERIAL_NOT_FOUND', 'MATERIAL_NOT_INTERACTIVE_SCORE', 'MATERIAL_PLAYBACK_UNAVAILABLE'])('does not retry %s', async (code) => {
    getScore.mockRejectedValue(new ApiError(409, { code }))

    await expect(new ApiScoreSource('m1').load()).rejects.toMatchObject({ code: 'unavailable' })
    expect(getScore).toHaveBeenCalledTimes(1)
  })

  it('lets a server or network failure be retried', async () => {
    getScore.mockRejectedValue(new ApiError(500, undefined))
    await expect(new ApiScoreSource('m1').load()).rejects.toMatchObject({ code: 'read-failed' })
  })

  it('stops when aborted', async () => {
    getScore.mockResolvedValue(answer())
    const controller = new AbortController()
    controller.abort()
    await expect(new ApiScoreSource('m1').load(controller.signal)).rejects.toMatchObject({ code: 'aborted' })
  })
})
