import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestPasswordReset, signIn, signOut } from '../api/authApi'

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  // Cached data belongs to the signed-out user; the next account must not see it.
  return useMutation({ mutationFn: signOut, onSuccess: () => queryClient.clear() })
}
