import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { SystemRole } from '@/shared/types/account'
import type { Account, CreateAccountValues } from '../types'

// TBD: Backend API missing – Admin account management (FE-47) and role assignment (FE-48).
// Decision 0002: no endpoint is guessed. Filtering is done client-side until server-side filters are defined.
// Each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped from dist/.

export async function listAccounts(): Promise<Account[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listAccountsFixture } = await import('./fixtures.dev')
    return listAccountsFixture()
  }
  throw new ApiContractMissingError('Xem danh sách tài khoản')
}

/** Admin creates an account directly (owner decision 2026-09-27); any FE-48 role, including Admin. */
export async function createAccount(values: CreateAccountValues): Promise<Account> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { createAccountFixture } = await import('./fixtures.dev')
    return createAccountFixture(values)
  }
  throw new ApiContractMissingError('Tạo tài khoản')
}

/** Confirms a pending account with the requested role or a different one (DECIDED 2026-09-26). */
export async function confirmAccount(id: string, role: SystemRole): Promise<Account> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { confirmAccountFixture } = await import('./fixtures.dev')
    return confirmAccountFixture(id, role)
  }
  throw new ApiContractMissingError('Xác nhận vai trò tài khoản')
}

/** Rejects a pending account; the account is kept with a rejected status (DECIDED 2026-09-26). */
export async function rejectAccount(id: string, reason?: string): Promise<Account> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { rejectAccountFixture } = await import('./fixtures.dev')
    return rejectAccountFixture(id, reason)
  }
  throw new ApiContractMissingError('Từ chối tài khoản')
}

/** Reopens a rejected account. The resulting status is defined by the backend (TBD). */
export async function reopenAccount(id: string): Promise<Account> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { reopenAccountFixture } = await import('./fixtures.dev')
    return reopenAccountFixture(id)
  }
  throw new ApiContractMissingError('Mở lại tài khoản')
}

export async function changeAccountRole(id: string, role: SystemRole): Promise<Account> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { changeAccountRoleFixture } = await import('./fixtures.dev')
    return changeAccountRoleFixture(id, role)
  }
  throw new ApiContractMissingError('Thay đổi vai trò tài khoản')
}
