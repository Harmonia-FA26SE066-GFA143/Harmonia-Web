import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { getRoster, savePersonnelRequirements, suggestRoster, updateAssignmentNote } from './rosterApi'

const fetchMock = vi.fn<typeof fetch>()
const respond = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
const sentBody = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

const assignment = {
  id: 'a1',
  memberId: 'm1',
  memberName: 'Giuse Khôi',
  skillId: 'k1',
  skillName: 'Tenor',
  songListItemId: null,
  songTitle: null,
  note: null,
  source: 'Suggested',
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('getRoster', () => {
  it('maps status, source and empty fields', async () => {
    respond({ id: 'r1', eventId: 'e1', status: 'Finalized', wholeServiceFinalizedAt: null, assignments: [assignment], shortages: [] })
    await expect(getRoster('e1')).resolves.toEqual({
      id: 'r1',
      status: 'finalized',
      wholeServiceFinalizedAt: undefined,
      assignments: [{ id: 'a1', memberId: 'm1', memberName: 'Giuse Khôi', skillId: 'k1', skillName: 'Tenor', songListItemId: null, note: undefined, source: 'suggested' }],
    })
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/service-rosters?eventId=e1')
  })

  it('is null while the event has no roster, and passes other errors on', async () => {
    respond({ code: 'ROSTER_NOT_FOUND' }, 404)
    await expect(getRoster('e1')).resolves.toBeNull()
    respond({ code: 'LITURGICAL_EVENT_NOT_FOUND' }, 404)
    await expect(getRoster('e1')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('suggestRoster', () => {
  it('reads the roster id of the suggestion and the AI flag', async () => {
    respond({ rosterId: 'r2', eventId: 'e1', status: 'Suggested', isAiGenerated: false, assignments: [{ ...assignment, source: 'Manual' }], shortages: [] })
    const { roster, isAiGenerated } = await suggestRoster('e1')
    expect(roster).toMatchObject({ id: 'r2', status: 'suggested', assignments: [{ source: 'manual' }] })
    expect(isAiGenerated).toBe(false)
    expect(sentBody()).toEqual({ eventId: 'e1' })
  })
})

describe('writes', () => {
  it('sends only skill ids and counts for requirements', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await savePersonnelRequirements('i1', [{ skillId: 'k1', skillName: 'Tenor', requiredCount: 2 }])
    expect(sentBody()).toEqual({ requirements: [{ skillId: 'k1', requiredCount: 2 }] })
  })

  it('clears a blank note', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await updateAssignmentNote('a1', '   ')
    expect(sentBody()).toEqual({ note: null })
  })
})
