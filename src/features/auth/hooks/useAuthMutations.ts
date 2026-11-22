import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { changePassword, requestPasswordReset, resetPassword, signIn, signInWithGoogle, signOut } from '../api/authApi'

export function useSignIn() {
  return useMutation({ mutationFn: signIn })
}

export function useSignInWithGoogle() {
  return useMutation({ mutationFn: signInWithGoogle })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword })
}

/** The session ends with the change, so its cached data goes too. `changePassword` marks the change completed. */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: changePassword, onSuccess: () => queryClient.clear() })
}

/**
 * `AuthGuard` sends the tab to /login as soon as the session is cleared, which unmounts the caller before a
 * `mutate(…, { onSuccess })` callback could run; these hook-level callbacks still run.
 */
export function useSignOut() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  return useMutation({
    mutationFn: (everywhere?: boolean) => signOut(everywhere),
    onSuccess: (_data, everywhere) => {
      // Cached data belongs to the signed-out user; the next account must not see it.
      queryClient.clear()
      message.success(everywhere ? 'Đã đăng xuất khỏi mọi thiết bị.' : 'Đã đăng xuất.')
    },
  })
}
