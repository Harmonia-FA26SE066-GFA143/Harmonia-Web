import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { createSong, deleteMaterial, getSong, listMaterials, listSongs, updateSongClassification, uploadMaterial } from './songsApi'

const fetchMock = vi.fn<typeof fetch>()
const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('songsApi', () => {
  it('sends the search, the filters set and the page as query parameters', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { items: [], pageNumber: 2, pageSize: 20, totalCount: 0, totalPages: 0 }))

    await listSongs({ search: '  xin vâng ', seasonId: 'season-1', themeId: 'theme-2' }, { pageNumber: 2, pageSize: 20 })
    const url = new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')
    expect(url.pathname).toBe('/api/songs')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      keyword: 'xin vâng',
      liturgicalSeasonId: 'season-1',
      songThemeId: 'theme-2',
      pageNumber: '2',
      pageSize: '20',
    })
  })

  it('reads an unknown song as null and lets other errors through', async () => {
    fetchMock.mockResolvedValueOnce(reply(404, { code: 'SONG_NOT_FOUND' }))
    await expect(getSong('missing')).resolves.toBeNull()

    fetchMock.mockResolvedValueOnce(reply(403))
    await expect(getSong('s1')).rejects.toBeInstanceOf(ApiError)
  })

  it('replaces the whole classification with PUT', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, {}))
    const values = {
      liturgicalSeasonIds: ['season-1'],
      massTypeIds: [],
      ceremonyTypeIds: [],
      songThemeIds: [],
      vocalRequirements: [{ skillId: 'sk1', isMandatory: true }],
      instrumentRequirements: [],
    }

    await updateSongClassification('s1', values)
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/songs\/s1\/classification$/)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'PUT', body: JSON.stringify(values) })
  })

  it('lists the materials of a song and maps the PascalCase material type', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, {
        items: [{ id: 'm1', songId: 's1', materialType: 'SampleAudio', title: 'Audio', fileName: 'a.mp3', fileUrl: 'https://x/a.mp3' }],
        pageNumber: 1,
        pageSize: 100,
        totalCount: 1,
        totalPages: 1,
      }),
    )

    const [material] = await listMaterials('s1')
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/music-materials\?songId=s1&pageNumber=1&pageSize=100$/)
    expect(material).toMatchObject({ id: 'm1', kind: 'sampleAudio', url: 'https://x/a.mp3' })
  })

  it('uploads the file and its fields as multipart form data', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { id: 'm2', materialType: 'Lyrics', fileUrl: 'https://x/l.pdf' }))
    const file = new File(['lời'], 'loi.pdf', { type: 'application/pdf' })

    await uploadMaterial('s1', { kind: 'lyrics', title: 'Lời', targetSkillId: 'sk1', file })
    const body = fetchMock.mock.calls[0][1]?.body as FormData
    expect(Object.fromEntries([...body.entries()].filter(([key]) => key !== 'file'))).toEqual({
      songId: 's1',
      title: 'Lời',
      materialType: 'Lyrics',
      targetSkillId: 'sk1',
    })
    expect(body.get('file')).toBeInstanceOf(File)
  })

  it('deletes a material', async () => {
    fetchMock.mockResolvedValueOnce(reply(204))

    await deleteMaterial('m1')
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/music-materials\/m1$/)
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })

  it('posts the song fields', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { id: 'new', title: 'Xin Vâng' }))

    await createSong({ title: 'Xin Vâng', composer: 'Hải Linh' })
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ title: 'Xin Vâng', composer: 'Hải Linh' }) })
  })
})
