import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RehearsalValues } from '../types'
import { createRecording, getRehearsal, saveRehearsal } from './rehearsalsApi'

const fetchMock = vi.fn<typeof fetch>()
const calls = () => fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), method: init?.method, body: init?.body }))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockImplementation(async () => new Response(null, { status: 204 }))
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('getRehearsal', () => {
  it('reads times without a zone as UTC and orders the songs', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'r1',
          locationName: null,
          startTime: '2026-11-13T12:30:00',
          endTime: '2026-11-13T14:00:00Z',
          note: null,
          songs: [
            { songId: 's2', songTitle: 'B', displayOrder: 2, note: null },
            { songId: 's1', songTitle: 'A', displayOrder: 1, note: 'Bè trầm' },
          ],
        }),
      ),
    )
    await expect(getRehearsal('r1')).resolves.toEqual({
      id: 'r1',
      choirId: undefined,
      eventId: undefined,
      locationId: undefined,
      locationName: undefined,
      startAt: '2026-11-13T12:30:00.000Z',
      endAt: '2026-11-13T14:00:00.000Z',
      note: undefined,
      songs: [
        { songId: 's1', songTitle: 'A', note: 'Bè trầm' },
        { songId: 's2', songTitle: 'B', note: undefined },
      ],
    })
  })
})

describe('saveRehearsal', () => {
  const values: RehearsalValues = {
    choirId: 'c1',
    eventId: 'e1',
    locationId: 'l1',
    startAt: '2026-11-13T12:30:00.000Z',
    endAt: '2026-11-13T14:00:00.000Z',
    songs: [{ songId: 's1', songTitle: 'A', note: 'Bè trầm' }],
  }

  it('creates the rehearsal with its choir and songs in one request', async () => {
    await saveRehearsal({ values })
    expect(calls()).toHaveLength(1)
    expect(calls()[0]).toMatchObject({ url: '/api/rehearsals', method: 'POST' })
    expect(JSON.parse(String(calls()[0].body))).toEqual({
      eventId: 'e1',
      locationId: 'l1',
      startTime: values.startAt,
      endTime: values.endAt,
      choirId: 'c1',
      songs: [{ songId: 's1', note: 'Bè trầm' }],
    })
  })

  it('updates the details, then replaces the songs', async () => {
    await saveRehearsal({ id: 'r1', values })
    expect(calls().map(({ url, method }) => `${method} ${url}`)).toEqual(['PUT /api/rehearsals/r1', 'PUT /api/rehearsals/r1/songs'])
    expect(JSON.parse(String(calls()[0].body))).not.toHaveProperty('choirId')
    expect(JSON.parse(String(calls()[1].body))).toEqual({ items: [{ songId: 's1', note: 'Bè trầm' }] })
  })
})

describe('createRecording', () => {
  const file = new File(['x'], 'take.webm')
  const sentForm = () => calls()[0].body as FormData

  it('clamps the duration to the backend range and leaves empty fields out', async () => {
    await createRecording('r1', { file, durationSeconds: 20_000 })
    expect(sentForm().get('durationSeconds')).toBe('14400')
    expect(sentForm().has('songId')).toBe(false)
    expect(sentForm().has('title')).toBe(false)
  })

  it('rounds a sub-second take up to one second', async () => {
    await createRecording('r1', { file, songId: 's1', title: 'Lần 1', durationSeconds: 0.4 })
    expect(Object.fromEntries([...sentForm().entries()].filter(([key]) => key !== 'file'))).toEqual({ songId: 's1', title: 'Lần 1', durationSeconds: '1' })
  })
})
