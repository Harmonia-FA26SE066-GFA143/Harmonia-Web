import { useMutation } from '@tanstack/react-query'
import { register, requestPasswordReset, signIn, signOut } from '../api/authApi'

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}

export function useRegister() {
  return useMutation({ mutationFn: register })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useSignOut() {
  return useMutation({ mutationFn: signOut })
}
