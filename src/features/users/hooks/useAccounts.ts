import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SystemRole } from '@/shared/types/account'
import {
  changeAccountRole,
  countAccounts,
  createAccount,
  listAccounts,
  setAccountActive,
  updateAccount,
  type AccountPage,
} from '../api/accountsApi'
import { assignableRoles } from '../roles'
import type { AccountFilters, CreateAccountValues, UpdateAccountValues } from '../types'

const accountsKey = ['users', 'accounts'] as const

/** One page of accounts; the previous page stays visible while the next one loads. */
export function useAccounts(filters: AccountFilters, page: AccountPage) {
  return useQuery({
    queryKey: [...accountsKey, 'list', filters, page],
    queryFn: () => listAccounts(filters, page),
    placeholderData: keepPreviousData,
  })
}

/** Accounts per role for the role summary, or undefined until every count has loaded. */
export function useRoleCounts(): Record<SystemRole, number> | undefined {
  return useQueries({
    queries: assignableRoles.map((role) => ({
      queryKey: [...accountsKey, 'count', role],
      queryFn: () => countAccounts(role),
    })),
    combine: (results) =>
      results.every((result) => result.isSuccess)
        ? (Object.fromEntries(assignableRoles.map((role, index) => [role, results[index].data])) as Record<
            SystemRole,
            number
          >)
        : undefined,
  })
}

/** Every account change refreshes the lists and counts; the backend returns the authoritative state. */
function useAccountMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }) })
}

export const useCreateAccount = () => useAccountMutation((values: CreateAccountValues) => createAccount(values))

export const useUpdateAccount = () =>
  useAccountMutation(({ id, values }: { id: string; values: UpdateAccountValues }) => updateAccount(id, values))

export const useSetAccountActive = () =>
  useAccountMutation(({ id, active }: { id: string; active: boolean }) => setAccountActive(id, active))

export const useChangeAccountRole = () =>
  useAccountMutation(({ id, role }: { id: string; role: SystemRole }) => changeAccountRole(id, role))
