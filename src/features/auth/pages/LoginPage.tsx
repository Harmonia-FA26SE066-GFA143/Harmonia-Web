import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/lib/api/errors'
import type { SystemRole } from '@/shared/types/account'
import { AuthCard } from '../components/AuthCard'
import { LoginForm, type LoginFeedback } from '../components/LoginForm'
import { useSignIn } from '../hooks/useAuthMutations'
import type { SignInValues } from '../types'

/** Web workspaces per role. Choir Members use the mobile app (FE-01–FE-14). */
const roleHomePaths: Partial<Record<SystemRole, string>> = {
  priest: paths.priest.dashboard,
  director: paths.director.dashboard,
  admin: paths.admin.dashboard,
}

/** Backend error codes of POST /api/auth/login (Harmonia_API_Doc, F1) the form explains on its own. */
function feedbackFor(error: Error): LoginFeedback {
  const code = error instanceof ApiError ? error.code : undefined
  if (code === 'AUTH_INVALID_CREDENTIALS') return { kind: 'invalid-credentials' }
  if (code === 'AUTH_ACCOUNT_INACTIVE') return { kind: 'inactive' }
  return { kind: 'unavailable' }
}

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [feedback, setFeedback] = useState<LoginFeedback>()

  const handleSubmit = (values: SignInValues) => {
    setFeedback(undefined)
    signIn.mutate(values, {
      onSuccess: ({ role, mustChangePassword }) => {
        const home = roleHomePaths[role]
        if (!home) setFeedback({ kind: 'member-web' })
        else navigate(mustChangePassword ? paths.changePassword : home)
      },
      onError: (error) => setFeedback(feedbackFor(error)),
    })
  }

  return (
    <AuthCard title="Đăng nhập" description="Đăng nhập để tiếp tục sử dụng Harmonia.">
      <LoginForm onSubmit={handleSubmit} submitting={signIn.isPending} feedback={feedback} />
    </AuthCard>
  )
}
