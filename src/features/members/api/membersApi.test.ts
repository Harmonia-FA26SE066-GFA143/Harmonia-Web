import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listChoirMembers } from './membersApi'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('listChoirMembers', () => {
  it('asks for active members only and keeps the names of their approved skills', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'mp1',
              fullName: 'Maria Nguyễn Thu Hướng',
              email: 'huong@giaoxu.org',
              status: 'Active',
              approvedSkills: [{ skillId: 'sk1', skillName: 'Organ', categoryId: 'c1', categoryName: 'Instrument' }],
            },
          ],
          pageNumber: 1,
          pageSize: 100,
          totalCount: 1,
          totalPages: 1,
        }),
        { status: 200 },
      ),
    )

    await expect(listChoirMembers()).resolves.toEqual([{ id: 'mp1', fullName: 'Maria Nguyễn Thu Hướng', skills: ['Organ'] }])
    const url = new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')
    expect(url.pathname).toBe('/api/member-profiles')
    expect(Object.fromEntries(url.searchParams)).toEqual({ status: 'Active', pageNumber: '1', pageSize: '100' })
  })
})
