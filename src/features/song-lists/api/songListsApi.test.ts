import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SongList } from '../types'
import { getSongList, saveSongList } from './songListsApi'

const fetchMock = vi.fn<typeof fetch>()
const respond = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
const call = () => ({ url: String(fetchMock.mock.calls[0][0]), method: fetchMock.mock.calls[0][1]?.method, body: JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) })

const dto = {
  id: 'l1',
  eventId: 'e1',
  version: 2,
  status: 'NeedsRevision',
  submittedAt: '2026-11-10T01:00:00Z',
  decidedAt: null,
  items: [
    { id: 'i2', songId: 's2', songTitle: 'Hiệp lễ', slotId: 'sl2', slotName: 'Hiệp lễ', displayOrder: 2, note: null },
    { id: 'i1', songId: 's1', songTitle: 'Nhập lễ', slotId: 'sl1', slotName: 'Nhập lễ', displayOrder: 1, note: 'Hát 2 lần' },
  ],
  reviews: [{ decision: 'RequestRevision', notes: null, reviewedAt: '2026-11-11T01:00:00Z' }],
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('getSongList', () => {
  it('maps status and decisions and orders the items', async () => {
    respond(dto)
    const list = await getSongList('e1')
    expect(list).toMatchObject({ status: 'needsRevision', decidedAt: undefined, reviews: [{ decision: 'requestRevision', notes: undefined }] })
    expect(list?.items.map((item) => item.id)).toEqual(['i1', 'i2'])
    expect(list?.items[1].note).toBeUndefined()
  })

  it('is null while the event has no list', async () => {
    respond({ code: 'SONG_LIST_NOT_FOUND' }, 404)
    await expect(getSongList('e1')).resolves.toBeNull()
  })
})

describe('saveSongList', () => {
  const items = [
    { songId: 's1', slotId: 'sl1', note: '  Hát 2 lần ' },
    { songId: 's2', slotId: 'sl2', note: '   ' },
  ]
  const expectedItems = [
    { songId: 's1', slotId: 'sl1', displayOrder: 1, note: 'Hát 2 lần' },
    { songId: 's2', slotId: 'sl2', displayOrder: 2 },
  ]

  it('replaces the items of a draft', async () => {
    respond({ ...dto, status: 'Draft' })
    await saveSongList('e1', { id: 'l1', status: 'draft' } as SongList, items)
    expect(call()).toEqual({ url: '/api/song-lists/l1/items', method: 'PUT', body: { items: expectedItems } })
  })

  it('starts a new version when there is no list or it was sent back', async () => {
    respond({ ...dto, status: 'Draft' })
    await saveSongList('e1', { id: 'l1', status: 'needsRevision' } as SongList, items)
    expect(call()).toEqual({ url: '/api/song-lists', method: 'POST', body: { eventId: 'e1', items: expectedItems } })
  })
})
