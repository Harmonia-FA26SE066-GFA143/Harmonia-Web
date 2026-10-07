import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changePassword, requestPasswordReset, resetPassword, signIn, signOut } from '../api/authApi'

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}

/** The session ends with the change, so its cached data goes too. */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: changePassword, onSuccess: () => queryClient.clear() })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  // Cached data belongs to the signed-out user; the next account must not see it.
  return useMutation({ mutationFn: signOut, onSuccess: () => queryClient.clear() })
}
