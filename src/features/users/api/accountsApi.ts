import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { ApiRoleName } from '@/lib/auth/session'
import { apiNameByRole, roleByApiName, type SystemRole } from '@/shared/types/account'
import type { Account, AccountFilters, CreateAccountValues, UpdateAccountValues } from '../types'

// `/api/users` (Harmonia-BE UsersController), Admin only.

export interface AccountPage {
  pageNumber: number
  pageSize: number
}

interface UserDto {
  id: string
  email: string
  fullName: string
  roleName: ApiRoleName
  isActive: boolean
}

const toAccount = ({ roleName, ...rest }: UserDto): Account => ({ ...rest, role: roleByApiName[roleName] })

export async function listAccounts(filters: AccountFilters, page: AccountPage): Promise<PagedList<Account>> {
  const result = await apiRequest<PagedList<UserDto>>(
    `/api/users${toQuery({
      keyword: filters.search.trim(),
      roleName: filters.role && apiNameByRole[filters.role],
      isActive: filters.isActive,
      ...page,
    })}`,
  )
  return { ...result, items: result.items.map(toAccount) }
}

/** Number of accounts holding a role, read from the paging envelope. */
export async function countAccounts(role: SystemRole): Promise<number> {
  const result = await apiRequest<PagedList<UserDto>>(
    `/api/users${toQuery({ roleName: apiNameByRole[role], pageNumber: 1, pageSize: 1 })}`,
  )
  return result.totalCount
}

/** The account starts active (Harmonia-BE UserService.CreateAsync). */
export async function createAccount({ role, ...values }: CreateAccountValues): Promise<Account> {
  return toAccount(
    await apiRequest<UserDto>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ ...values, roleName: apiNameByRole[role] }),
    }),
  )
}

export async function updateAccount(id: string, values: UpdateAccountValues): Promise<Account> {
  return toAccount(await apiRequest<UserDto>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(values) }))
}

/** Deactivating also revokes the user's sessions; the backend refuses the caller's own account and the last Admin. */
export function setAccountActive(id: string, active: boolean): Promise<void> {
  return apiRequest<void>(`/api/users/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' })
}

/** The user must sign in again afterwards: the backend revokes their sessions. */
export async function changeAccountRole(id: string, role: SystemRole): Promise<Account> {
  return toAccount(
    await apiRequest<UserDto>(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleName: apiNameByRole[role] }),
    }),
  )
}
