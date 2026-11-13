import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent, getEvent, getPreparationStatus, listEvents } from './eventsApi'

const fetchMock = vi.fn<typeof fetch>()
const respond = (body: unknown, status = 200) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
const url = () => new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')
const sentBody = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

const dto = {
  id: 'e1',
  eventDate: '2026-11-15',
  time: '07:30:00',
  liturgicalSeasonId: 's1',
  massTypeId: null,
  ceremonyTypeId: null,
  categoryId: null,
  locationId: 'l1',
  locationName: 'Nhà thờ',
  title: null,
  specialRequirements: null,
  status: 'Published',
  publishedAt: null,
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('events', () => {
  it('filters by the backend status and maps an event', async () => {
    respond({ items: [dto], pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1 })
    const { items } = await listEvents({ status: 'cancelled', fromDate: '2026-11-01' }, { pageNumber: 1, pageSize: 20 })
    expect(Object.fromEntries(url().searchParams)).toEqual({ status: 'Cancelled', fromDate: '2026-11-01', pageNumber: '1', pageSize: '20' })
    expect(items[0]).toMatchObject({ date: '2026-11-15', time: '07:30', title: undefined, seasonId: 's1', massTypeId: undefined, status: 'published' })
  })

  it('is null for an unknown event', async () => {
    respond({ code: 'LITURGICAL_EVENT_NOT_FOUND' }, 404)
    await expect(getEvent('e1')).resolves.toBeNull()
  })

  it('sends the time with seconds and the backend field names', async () => {
    respond({ ...dto, status: 'Draft' })
    await createEvent({ date: '2026-11-15', time: '07:30', locationId: 'l1', seasonId: 's1', choirIds: ['c1'], leadChoirId: 'c1' })
    expect(sentBody()).toEqual({ eventDate: '2026-11-15', time: '07:30:00', locationId: 'l1', liturgicalSeasonId: 's1', choirIds: ['c1'], leadChoirId: 'c1' })
  })
})

describe('getPreparationStatus', () => {
  const status = {
    songListStatus: null,
    participationInvited: 1,
    participationConfirmed: 2,
    participationDeclined: 3,
    participationUnsure: 4,
    rosterStatus: null,
    rosterActiveAssignments: 0,
    rosterShortages: [{ songTitle: null, skillName: 'Organ', requiredCount: 1, assignedCount: 0 }],
    rehearsalsTotal: 0,
    rehearsalsHeld: 0,
    attendanceExpected: 0,
    attendancePresent: 0,
    practiceExpected: 0,
    practicePassed: 0,
    practiceOverdue: 0,
  }

  it('groups participation and leaves the roster unknown without one', async () => {
    respond(status)
    await expect(getPreparationStatus('e1')).resolves.toMatchObject({
      songListStatus: undefined,
      participation: { invited: 1, confirmed: 2, declined: 3, unsure: 4 },
      rosterFinalized: undefined,
      rosterShortages: [{ songTitle: undefined, skillName: 'Organ' }],
    })
  })

  it('reads finalized only from the Finalized status', async () => {
    respond({ ...status, songListStatus: 'NeedsRevision', rosterStatus: 'Suggested' })
    await expect(getPreparationStatus('e1')).resolves.toMatchObject({ songListStatus: 'needsRevision', rosterFinalized: false })
    fetchMock.mockReset()
    respond({ ...status, rosterStatus: 'Finalized' })
    await expect(getPreparationStatus('e1')).resolves.toMatchObject({ rosterFinalized: true })
  })
})
