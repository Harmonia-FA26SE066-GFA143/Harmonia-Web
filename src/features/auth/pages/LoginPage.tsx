import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { env } from '@/config/env'
import { ApiError } from '@/lib/api/errors'
import type { SystemRole } from '@/shared/types/account'
import { AuthCard } from '../components/AuthCard'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { LoginForm, type LoginFeedback } from '../components/LoginForm'
import { useSignIn, useSignInWithGoogle } from '../hooks/useAuthMutations'
import type { SignInResult, SignInValues } from '../types'

/** Web workspaces per role. Choir Members use the mobile app (FE-01–FE-14). */
const roleHomePaths: Partial<Record<SystemRole, string>> = {
  priest: paths.priest.dashboard,
  director: paths.director.dashboard,
  admin: paths.admin.dashboard,
}

/**
 * Backend error codes of POST /api/auth/login and /api/auth/google (Harmonia-BE AuthService, ErrorStatusMap) the form
 * explains on its own. With Google, AUTH_INVALID_CREDENTIALS means the email has no account.
 */
function feedbackFor(error: Error, google = false): LoginFeedback {
  const code = error instanceof ApiError ? error.code : undefined
  if (code === 'AUTH_INVALID_CREDENTIALS') return { kind: google ? 'google-not-registered' : 'invalid-credentials' }
  if (code === 'AUTH_GOOGLE_TOKEN_INVALID' || code === 'AUTH_GOOGLE_TOKEN_REQUIRED') return { kind: 'google-invalid' }
  if (code === 'AUTH_ACCOUNT_INACTIVE') return { kind: 'inactive' }
  return { kind: 'unavailable' }
}

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const googleSignIn = useSignInWithGoogle()
  const pending = signIn.isPending || googleSignIn.isPending
  const [params] = useSearchParams()
  // apiRequest ends a dead session with a redirect to /login?reason=session-ended.
  const [feedback, setFeedback] = useState<LoginFeedback | undefined>(() =>
    params.get('reason') === 'session-ended' ? { kind: 'session-ended' } : undefined,
  )

  const enter = ({ role, mustChangePassword }: SignInResult) => {
    const home = roleHomePaths[role]
    if (!home) setFeedback({ kind: 'member-web' })
    else navigate(mustChangePassword ? paths.changePassword : home)
  }

  const handleSubmit = (values: SignInValues) => {
    if (pending) return
    setFeedback(undefined)
    signIn.mutate(values, { onSuccess: enter, onError: (error) => setFeedback(feedbackFor(error)) })
  }

  const handleGoogle = (idToken: string) => {
    if (pending) return
    setFeedback(undefined)
    googleSignIn.mutate(idToken, { onSuccess: enter, onError: (error) => setFeedback(feedbackFor(error, true)) })
  }

  return (
    <AuthCard title="Đăng nhập" description="Đăng nhập để tiếp tục sử dụng Harmonia.">
      <LoginForm
        onSubmit={handleSubmit}
        submitting={pending}
        feedback={feedback}
        alternative={env.googleClientId && <GoogleSignInButton clientId={env.googleClientId} onCredential={handleGoogle} />}
      />
    </AuthCard>
  )
}
