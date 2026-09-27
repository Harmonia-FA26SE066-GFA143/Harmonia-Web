import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { LiturgicalProgram, LiturgicalProgramDetail, ProgramFormValues } from '../types'

// TBD: Backend API missing – liturgical programs (FE-15–FE-16) and their song lists (FE-17–FE-20).
// Decision 0002: no endpoint is guessed. Each function checks `import.meta.env.DEV` at the call site so the
// fixture import is dropped from dist/.

/** Programs ordered by celebration date. Paging and server-side filters are TBD. */
export async function listPrograms(): Promise<LiturgicalProgram[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listProgramsFixture } = await import('./fixtures.dev')
    return listProgramsFixture()
  }
  throw new ApiContractMissingError('Xem danh sách chương trình phụng vụ')
}

/**
 * One program with its song list, or `null` when it does not exist.
 * TBD: how the backend reports a missing program (e.g. HTTP 404) is defined with the contract.
 */
export async function getProgram(id: string): Promise<LiturgicalProgramDetail | null> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getProgramFixture } = await import('./fixtures.dev')
    return getProgramFixture(id)
  }
  throw new ApiContractMissingError('Xem chi tiết chương trình phụng vụ')
}

export async function createProgram(values: ProgramFormValues): Promise<LiturgicalProgram> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { createProgramFixture } = await import('./fixtures.dev')
    return createProgramFixture(values)
  }
  throw new ApiContractMissingError('Tạo chương trình phụng vụ')
}
