import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getActivityTrend, getReport, listExports } from './reportsApi'

const fetchMock = vi.fn<typeof fetch>()
const respond = (body: unknown) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))
const paged = (items: unknown[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })
const requested = () => new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('getReport', () => {
  it('sends the month as date bounds with the page, to the report path', async () => {
    respond(paged([]))
    await getReport('songUsage', { month: '2026-02', seasonId: 's1' }, { pageNumber: 2, pageSize: 20 })
    const url = requested()
    expect(url.pathname).toBe('/api/reports/song-usage')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      liturgicalSeasonId: 's1',
      fromDate: '2026-02-01',
      toDate: '2026-02-28',
      pageNumber: '2',
      pageSize: '20',
    })
  })

  it('words the service history row: date, short time, default title', async () => {
    respond(
      paged([
        {
          eventId: 'e1',
          eventDate: '2026-11-15',
          time: '07:30:00',
          title: null,
          liturgicalSeasonName: null,
          locationName: 'Nhà thờ',
          songCount: 6,
          membersServed: 20,
          participationConfirmed: 18,
          participationDeclined: 2,
          rehearsalsHeld: 2,
          attendancePresent: 30,
        },
      ]),
    )
    const { items } = await getReport('serviceHistory', {}, { pageNumber: 1, pageSize: 20 })
    expect(items[0]).toMatchObject({
      id: 'e1',
      programId: 'e1',
      cells: { eventDate: '15/11/2026', time: '07:30', title: 'Sự kiện phụng vụ', liturgicalSeasonName: undefined, songCount: 6 },
    })
  })

  it('names the role and the active flag in user activity, keeping an unknown role as sent', async () => {
    const user = { fullName: '', email: 'a@x.vn', isActive: false, lastLoginAt: null, passwordChangeCount: 0, passwordResetCount: 0, accountChangeCount: 0, actionCount: 3 }
    respond(paged([{ ...user, userId: 'u1', roleName: 'ChoirDirector' }, { ...user, userId: 'u2', roleName: 'Robot', isActive: true }]))
    const { items } = await getReport('userActivity', {}, { pageNumber: 1, pageSize: 20 })
    expect(items[0].cells).toMatchObject({ fullName: undefined, roleName: 'Ca trưởng', isActive: 'Không', lastLoginAt: undefined })
    expect(items[1].cells).toMatchObject({ roleName: 'Robot', isActive: 'Có' })
  })
})

describe('listExports', () => {
  it('maps backend report types and formats', async () => {
    respond(
      paged([
        {
          id: 'x1',
          reportType: 'RehearsalAttendance',
          format: 'Xlsx',
          liturgicalSeasonId: null,
          fromDate: '2026-11-01',
          toDate: null,
          exportedByName: 'Admin',
          exportedAt: '2026-11-12T01:00:00Z',
          downloadUrl: 'https://files/x1.xlsx',
        },
      ]),
    )
    const { items } = await listExports({ pageNumber: 1, pageSize: 20 })
    expect(items[0]).toEqual(expect.objectContaining({ kind: 'rehearsalAttendance', format: 'xlsx', seasonId: undefined, fromDate: '2026-11-01', toDate: undefined }))
  })
})

describe('getActivityTrend', () => {
  it('sends the backend period name and turns missing rates into undefined', async () => {
    respond([{ periodStart: '2026-11-01', attendanceRate: null, completionRate: 0.5 }])
    const rows = await getActivityTrend({ groupBy: 'month', fromDate: '2026-01-01', toDate: '2026-12-31' })
    expect(requested().searchParams.get('groupBy')).toBe('Month')
    expect(rows).toEqual([{ periodStart: '2026-11-01', attendanceRate: undefined, completionRate: 0.5 }])
  })
})
