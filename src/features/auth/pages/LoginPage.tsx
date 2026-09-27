import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import type { SystemRole } from '@/shared/types/account'
import { AuthCard } from '../components/AuthCard'
import { LoginForm, type LoginFeedback } from '../components/LoginForm'
import { useSignIn } from '../hooks/useAuthMutations'
import type { SignInValues } from '../types'

/** Web workspaces per confirmed role. Choir Members use the mobile app (FE-01–FE-14). */
const roleHomePaths: Partial<Record<SystemRole, string>> = {
  priest: paths.priest.dashboard,
  director: paths.director.dashboard,
  admin: paths.admin.dashboard,
}

export function LoginPage() {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [feedback, setFeedback] = useState<LoginFeedback>()

  const handleSubmit = (values: SignInValues) => {
    setFeedback(undefined)
    signIn.mutate(values, {
      onSuccess: (result) => {
        if (result.status === 'pending') {
          navigate(paths.pendingConfirmation)
        } else if (result.status === 'rejected') {
          setFeedback({ kind: 'rejected', reason: result.reason })
        } else {
          const home = roleHomePaths[result.role]
          if (home) navigate(home)
          else setFeedback({ kind: 'member-web' })
        }
      },
      // TBD: Backend API missing – invalid credentials cannot be told apart until the auth error format is known.
      onError: () => setFeedback({ kind: 'unavailable' }),
    })
  }

  return (
    <AuthCard
      title="Đăng nhập"
      description="Đăng nhập để tiếp tục sử dụng Harmonia."
      footer={
        <>
          Chưa có tài khoản? <Link to={paths.register}>Đăng ký</Link>
        </>
      }
    >
      <LoginForm onSubmit={handleSubmit} submitting={signIn.isPending} feedback={feedback} />
    </AuthCard>
  )
}
