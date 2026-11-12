import { apiRequest } from '@/lib/api/client'
import type { ApiRoleName } from '@/lib/auth/session'
import { roleByApiName } from '@/shared/types/account'
import type { Profile, ProfileUpdateValues } from '../types'

// `GET/PUT /api/auth/me` (Harmonia-BE AuthController): every signed-in role reads its own account and edits its own
// name and phone. Allowed while the first password still has to be changed. `PUT/DELETE /api/auth/me/avatar`
// (BE 90af733) replace or remove the user's own picture; refused until the first password is changed.

interface UserDto {
  email: string
  fullName: string
  phone: string | null
  saintName: string | null
  avatarUrl: string | null
  roleName: ApiRoleName
}

const toProfile = ({ email, fullName, phone, saintName, avatarUrl, roleName }: UserDto): Profile => ({
  email,
  fullName,
  phone: phone ?? undefined,
  saintName: saintName ?? undefined,
  avatarUrl: avatarUrl ?? undefined,
  role: roleByApiName[roleName],
})

export async function getMyProfile(): Promise<Profile> {
  return toProfile(await apiRequest<UserDto>('/api/auth/me'))
}

/** Every field is replaced: an empty one clears it (UpdateMyUserRequestValidator: name ≤ 100, phone ≤ 20, saint name ≤ 50). */
export async function updateMyProfile({ fullName, phone, saintName }: ProfileUpdateValues): Promise<Profile> {
  return toProfile(
    await apiRequest<UserDto>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: fullName?.trim() || undefined,
        phone: phone?.trim() || undefined,
        saintName: saintName?.trim() || undefined,
      }),
    }),
  )
}

/** `.jpg`, `.jpeg`, `.png` or `.webp`, at most 2 MB (checked again by the backend); the old picture is deleted. */
export async function updateMyAvatar(file: File): Promise<Profile> {
  const form = new FormData()
  form.append('file', file)
  return toProfile(await apiRequest<UserDto>('/api/auth/me/avatar', { method: 'PUT', body: form }))
}

/** Also answers 204 when there is no picture. */
export async function deleteMyAvatar(): Promise<void> {
  await apiRequest<void>('/api/auth/me/avatar', { method: 'DELETE' })
}
