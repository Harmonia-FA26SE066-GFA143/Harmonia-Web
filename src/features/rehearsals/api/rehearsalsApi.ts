import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { Rehearsal, RehearsalValues } from '../types'

// TBD: Backend API missing – rehearsal schedules of liturgical programs (FE-26). Decision 0002: no endpoint is
// guessed. Each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped from dist/.

/** All rehearsals the Choir Director can see, in start order. Paging and server-side filters are TBD. */
export async function listRehearsals(): Promise<Rehearsal[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listRehearsalsFixture } = await import('./fixtures.dev')
    return listRehearsalsFixture()
  }
  throw new ApiContractMissingError('Xem lịch tập')
}

/** Creates a rehearsal, or updates it when `id` is given. */
export async function saveRehearsal(input: { id?: string; values: RehearsalValues }): Promise<Rehearsal> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveRehearsalFixture } = await import('./fixtures.dev')
    return saveRehearsalFixture(input)
  }
  throw new ApiContractMissingError(input.id ? 'Sửa buổi tập' : 'Tạo buổi tập')
}

export async function deleteRehearsal(id: string): Promise<void> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { deleteRehearsalFixture } = await import('./fixtures.dev')
    return deleteRehearsalFixture(id)
  }
  throw new ApiContractMissingError('Xoá buổi tập')
}
