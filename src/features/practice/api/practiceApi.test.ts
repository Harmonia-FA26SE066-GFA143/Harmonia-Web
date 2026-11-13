import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { commentSubmission, createAssignment, listAssignments, listPreparationProgress, listSubmissions } from './practiceApi'

const fetchMock = vi.fn<typeof fetch>()
const respond = (body: unknown) => fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))
const noContent = () => fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
const paged = (items: unknown[]) => ({ items, pageNumber: 1, pageSize: 20, totalCount: items.length, totalPages: 1 })
const url = () => new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')
const sentBody = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('practice submissions', () => {
  it('filters by the backend status name and maps the statuses back', async () => {
    respond(
      paged([
        {
          id: 'ps1',
          practiceAssignmentId: 'pa1',
          assignmentTitle: 'Tập bè Tenor',
          assignmentDueDate: '2026-11-20',
          memberName: 'Giuse Khôi',
          attemptNo: 2,
          submittedAt: '2026-11-12T01:00:00Z',
          status: 'NeedsRevision',
          durationSeconds: null,
          audioUrl: 'https://files/ps1.webm',
          feedbacks: [{ id: 'f1', result: 'Passed', comment: null, reviewerName: 'CT', reviewedAt: '2026-11-12T02:00:00Z' }],
        },
      ]),
    )
    const { items } = await listSubmissions('needsRevision', { pageNumber: 1, pageSize: 20 })
    expect(url().searchParams.get('status')).toBe('NeedsRevision')
    expect(items[0]).toMatchObject({ assignmentId: 'pa1', status: 'needsRevision', feedbacks: [{ result: 'passed' }] })
  })

  it('leaves the status out when not filtering', async () => {
    respond(paged([]))
    await listSubmissions(undefined, { pageNumber: 1, pageSize: 20 })
    expect(url().searchParams.has('status')).toBe(false)
  })

  it('sends a changed result by its backend name, and none when unchanged', async () => {
    noContent()
    await commentSubmission('ps1', { comment: 'Tốt', result: 'passed' })
    expect(sentBody()).toEqual({ comment: 'Tốt', result: 'Passed' })
    fetchMock.mockReset()
    noContent()
    await commentSubmission('ps1', { comment: 'Tốt' })
    expect(sentBody()).toEqual({ comment: 'Tốt' })
  })
})

describe('practice assignments', () => {
  it('maps the scope both ways', async () => {
    respond(paged([{ id: 'pa1', eventId: null, title: 'Bài 1', instruction: null, scope: 'SkillGroup', dueDate: '2026-11-20', skillIds: ['k1'], memberIds: [] }]))
    const { items } = await listAssignments(undefined, { pageNumber: 1, pageSize: 20 })
    expect(items[0]).toMatchObject({ eventId: undefined, instruction: undefined, scope: 'skillGroup' })

    fetchMock.mockReset()
    noContent()
    await createAssignment({ choirId: 'c1', title: 'Bài 2', scope: 'individual', dueDate: '2026-11-20T00:00:00Z', skillIds: [], memberIds: ['m1'] })
    expect(sentBody()).toMatchObject({ scope: 'Individual', memberIds: ['m1'] })
  })
})

describe('listPreparationProgress', () => {
  it('maps the answer and keeps no answer as undefined', async () => {
    const row = { memberId: 'm1', fullName: 'An', rehearsalsHeld: 2, rehearsalsAttended: 1, assignmentsTotal: 1, assignmentsPassed: 0, assignmentsOverdue: 1 }
    respond([{ ...row, participationStatus: 'Unsure' }, { ...row, memberId: 'm2', participationStatus: null }])
    const rows = await listPreparationProgress('e1')
    expect(rows.map((entry) => entry.participationStatus)).toEqual(['unsure', undefined])
    expect(rows[0]).toEqual({ ...row, participationStatus: 'unsure' })
  })
})
