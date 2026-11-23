import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listAllChoirMembers, listChoirMembers, searchMembers } from './membersApi'

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

describe('listAllChoirMembers', () => {
  it('reads every page of active members instead of stopping at 100 (G2-03, B54)', async () => {
    const page = (pageNumber: number, ids: string[]) =>
      new Response(
        JSON.stringify({
          items: ids.map((id) => ({ id, fullName: id, email: `${id}@x.org`, status: 'Active', approvedSkills: [{ skillId: 's', skillName: 'Alto' }] })),
          pageNumber,
          pageSize: 100,
          totalCount: 201,
          totalPages: 3,
        }),
        { status: 200 },
      )
    fetchMock.mockImplementation(async (input) => {
      const pageNumber = Number(new URL(String(input), 'http://localhost').searchParams.get('pageNumber'))
      return page(pageNumber, [`p${pageNumber}a`, `p${pageNumber}b`])
    })

    const members = await listAllChoirMembers()
    expect(members.map((member) => member.id)).toEqual(['p1a', 'p1b', 'p2a', 'p2b', 'p3a', 'p3b'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    for (const [input] of fetchMock.mock.calls) {
      expect(new URL(String(input), 'http://localhost').searchParams.get('status')).toBe('Active')
    }
  })
})

describe('searchMembers', () => {
  it('keeps the account role, so a profile kept after a role change reads as history (BE 9b1f587)', async () => {
    const dto = {
      id: 'mp2',
      fullName: 'Giuse Trần Văn Bình',
      email: 'binh@giaoxu.org',
      phone: null,
      dateOfBirth: null,
      joinedDate: '2020-01-01',
      status: 'Inactive',
      avatarUrl: null,
      roleName: 'ChoirDirector',
      approvedSkills: [],
    }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [dto], pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1 }), { status: 200 }),
    )

    const page = await searchMembers({ search: '' }, { pageNumber: 1, pageSize: 20 })
    expect(page.items[0]).toMatchObject({ id: 'mp2', status: 'inactive', role: 'director' })
  })
})
