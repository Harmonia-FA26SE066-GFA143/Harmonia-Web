import { ApiContractMissingError } from '@/lib/api/errors'
import type { Profile, ProfileUpdateValues } from '../types'

// TBD: Backend API missing – current-user profile read/update. Decision 0002: no endpoint is guessed.

export async function getMyProfile(): Promise<Profile> {
  throw new ApiContractMissingError('Xem hồ sơ cá nhân')
}

export async function updateMyProfile(_values: ProfileUpdateValues): Promise<Profile> {
  throw new ApiContractMissingError('Cập nhật hồ sơ cá nhân')
}
