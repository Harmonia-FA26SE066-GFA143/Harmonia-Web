import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../placeholderRoute'

const loadAuth = () => import('@/features/auth')

/**
 * Sign-in and related routes (phase 1). Accounts are created by an Admin (POST /api/users); the API has no
 * self-registration. Route protection (ProtectedRoute/RoleGuard) is a separate issue.
 */
export const authRoutes: RouteObject[] = [
  pageRoute(paths.login, { title: 'Đăng nhập', phase: 1 }, async () => (await loadAuth()).LoginPage),
  pageRoute(
    paths.forgotPassword,
    { title: 'Quên mật khẩu?', phase: 1 },
    async () => (await loadAuth()).ForgotPasswordPage,
  ),
]
