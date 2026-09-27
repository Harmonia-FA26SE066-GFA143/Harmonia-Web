import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { SystemRole } from '@/shared/types/account'
import {
  changeAccountRole,
  confirmAccount,
  createAccount,
  listAccounts,
  rejectAccount,
  reopenAccount,
} from '../api/accountsApi'
import type { CreateAccountValues } from '../types'

const accountsKey = ['users', 'accounts'] as const

export function useAccounts() {
  return useQuery({
    queryKey: accountsKey,
    queryFn: listAccounts,
    // Retrying cannot help while the API contract is missing.
    retry: (failureCount, error) => !(error instanceof ApiContractMissingError) && failureCount < 3,
  })
}

/** Every account change refreshes the list; the backend returns the authoritative status. */
function useAccountMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }) })
}

export const useCreateAccount = () => useAccountMutation((values: CreateAccountValues) => createAccount(values))

export const useConfirmAccount = () =>
  useAccountMutation(({ id, role }: { id: string; role: SystemRole }) => confirmAccount(id, role))

export const useRejectAccount = () =>
  useAccountMutation(({ id, reason }: { id: string; reason?: string }) => rejectAccount(id, reason))

export const useReopenAccount = () => useAccountMutation((id: string) => reopenAccount(id))

export const useChangeAccountRole = () =>
  useAccountMutation(({ id, role }: { id: string; role: SystemRole }) => changeAccountRole(id, role))
