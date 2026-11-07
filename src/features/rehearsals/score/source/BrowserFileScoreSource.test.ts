import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUDIO_MAX_BYTES, BrowserFileScoreSource, SCORE_MAX_BYTES } from './BrowserFileScoreSource'
import { ScoreSourceError, type ScoreSourceErrorCode } from './types'

const XML = '<score-partwise/>'
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04])

function wav(name = 'sample.wav') {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'audio/wav' })
}

/** A file whose size is faked so tests do not allocate megabytes. */
function sized(file: File, size: number) {
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/** A file whose read stays pending until the test settles it. */
function pendingFile(name: string) {
  const file = new File([ZIP], name)
  let fail: (reason: unknown) => void = () => undefined
  const pending = new Promise<never>((_, reject) => {
    fail = reject
  })
  Object.defineProperty(file, 'arrayBuffer', { value: () => pending })
  Object.defineProperty(file, 'text', { value: () => pending })
  return { file, fail }
}

async function rejection(promise: Promise<unknown>, code: ScoreSourceErrorCode) {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ScoreSourceError)
  expect((error as ScoreSourceError).code).toBe(code)
  return error as ScoreSourceError
}

const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL }
let created: string[]
let revoked: string[]

beforeEach(() => {
  created = []
  revoked = []
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length}`
    created.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url)
  })
})

afterEach(() => {
  URL.createObjectURL = original.create
  URL.revokeObjectURL = original.revoke
})

describe('BrowserFileScoreSource', () => {
  it('reads .musicxml as text and gives the audio an object URL', async () => {
    const pkg = await new BrowserFileScoreSource({ score: new File([XML], 'Bai.MusicXML'), audio: wav() }).load()

    expect(pkg.score).toEqual({ data: XML, format: 'musicxml', fileName: 'Bai.MusicXML' })
    expect(pkg.audioUrl).toBe('blob:test/0')
  })

  it('reads .mxl as bytes', async () => {
    const pkg = await new BrowserFileScoreSource({ score: new File([ZIP], 'bai.mxl'), audio: wav() }).load()

    expect(pkg.score.format).toBe('mxl')
    expect(pkg.score.data).toBeInstanceOf(Uint8Array)
    expect(Array.from(pkg.score.data as Uint8Array)).toEqual(Array.from(ZIP))
  })

  it.each([
    ['score', new File([XML], 'bai.xml'), wav()],
    ['score', new File([XML], 'musicxml'), wav()],
    ['audio', new File([XML], 'bai.musicxml'), wav('bai.mp3')],
  ])('rejects a %s file with the wrong extension', async (_, score, audio) => {
    const error = await rejection(new BrowserFileScoreSource({ score, audio }).load(), 'invalid-type')
    expect(error.message).toMatch(/Vui lòng chọn/)
    expect(created).toEqual([])
  })

  it('rejects a score over 20 MB and an audio file over its limit, accepting exactly the limit', async () => {
    await rejection(
      new BrowserFileScoreSource({ score: sized(new File([XML], 'a.musicxml'), SCORE_MAX_BYTES + 1), audio: wav() }).load(),
      'too-large',
    )
    await rejection(
      new BrowserFileScoreSource({ score: new File([XML], 'a.musicxml'), audio: sized(wav(), AUDIO_MAX_BYTES + 1) }).load(),
      'too-large',
    )
    expect(created).toEqual([])

    const pkg = await new BrowserFileScoreSource({
      score: sized(new File([XML], 'a.musicxml'), SCORE_MAX_BYTES),
      audio: sized(wav(), AUDIO_MAX_BYTES),
    }).load()
    expect(pkg.audioUrl).toBe('blob:test/0')
  })

  it('maps a failed read to read-failed and keeps the cause', async () => {
    const { file, fail } = pendingFile('bai.mxl')
    const load = new BrowserFileScoreSource({ score: file, audio: wav() }).load()
    const cause = new Error('disk')
    fail(cause)

    const error = await rejection(load, 'read-failed')
    expect(error.cause).toBe(cause)
    expect(created).toEqual([])
  })

  it('dispose revokes the audio URL once, however often it is called', async () => {
    const pkg = await new BrowserFileScoreSource({ score: new File([XML], 'a.musicxml'), audio: wav() }).load()

    pkg.dispose()
    pkg.dispose()

    expect(revoked).toEqual(['blob:test/0'])
  })

  it('an already aborted signal rejects with aborted before reading', async () => {
    const controller = new AbortController()
    controller.abort()

    await rejection(new BrowserFileScoreSource({ score: new File([XML], 'a.musicxml'), audio: wav() }).load(controller.signal), 'aborted')
    expect(created).toEqual([])
  })

  it('aborting during the read rejects with aborted and creates no URL', async () => {
    const controller = new AbortController()
    const { file } = pendingFile('bai.mxl')
    const load = new BrowserFileScoreSource({ score: file, audio: wav() }).load(controller.signal)

    controller.abort()

    await rejection(load, 'aborted')
    expect(created).toEqual([])
    expect(revoked).toEqual([])
  })
})
