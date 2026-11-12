import { afterEach, describe, expect, it, vi } from 'vitest'
import * as accountsApi from '@/features/users/api/accountsApi'
import * as membersApi from '@/features/members/api/membersApi'
import * as profileApi from '@/features/profile/api/profileApi'
import * as client from '@/lib/api/client'
import { personName } from './personName'

afterEach(() => vi.restoreAllMocks())

describe('personName', () => {
  it('puts the saint name first when there is one', () => {
    expect(personName('Nguyễn Văn An', 'Giuse')).toBe('Giuse Nguyễn Văn An')
    expect(personName('Nguyễn Văn An', null)).toBe('Nguyễn Văn An')
    expect(personName('Nguyễn Văn An', '  ')).toBe('Nguyễn Văn An')
  })
})

describe('saint name on the wire (PUT replaces every field)', () => {
  const user = { id: 'u1', email: 'a@b.c', fullName: 'An', phone: null, saintName: 'Giuse', avatarUrl: null, roleName: 'ChoirMember', isActive: true, isPasswordChangeRequired: false }
  const bodyOf = (spy: ReturnType<typeof vi.spyOn>) => JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)

  it('sends it for the own profile, the account and the member record', async () => {
    const request = vi.spyOn(client, 'apiRequest').mockResolvedValue(user)

    const profile = await profileApi.updateMyProfile({ fullName: 'An', saintName: ' Giuse ' })
    expect(bodyOf(request)).toMatchObject({ saintName: 'Giuse' })
    expect(profile.saintName).toBe('Giuse')

    request.mockClear()
    await accountsApi.updateAccount('u1', { email: 'a@b.c', saintName: 'Giuse' })
    expect(bodyOf(request)).toMatchObject({ saintName: 'Giuse' })

    request.mockClear()
    await membersApi.updateMember('m1', { joinedDate: '2024-01-01', status: 'active', saintName: 'Giuse' })
    expect(bodyOf(request)).toMatchObject({ saintName: 'Giuse', status: 'Active' })
  })
})
