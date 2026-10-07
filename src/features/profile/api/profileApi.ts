import { apiRequest } from '@/lib/api/client'
import type { ApiRoleName } from '@/lib/auth/session'
import { roleByApiName } from '@/shared/types/account'
import type { Profile, ProfileUpdateValues } from '../types'

// `GET/PUT /api/auth/me` (Harmonia-BE AuthController): every signed-in role reads its own account and edits its own
// name and phone. Allowed while the first password still has to be changed.

interface UserDto {
  email: string
  fullName: string
  phone: string | null
  roleName: ApiRoleName
}

const toProfile = ({ email, fullName, phone, roleName }: UserDto): Profile => ({
  email,
  fullName,
  phone: phone ?? undefined,
  role: roleByApiName[roleName],
})

export async function getMyProfile(): Promise<Profile> {
  return toProfile(await apiRequest<UserDto>('/api/auth/me'))
}

/** Both fields are replaced: an empty name or phone clears it (UpdateMyUserRequestValidator: ≤ 100 / ≤ 20). */
export async function updateMyProfile({ fullName, phone }: ProfileUpdateValues): Promise<Profile> {
  return toProfile(
    await apiRequest<UserDto>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ fullName: fullName?.trim() || undefined, phone: phone?.trim() || undefined }),
    }),
  )
}
