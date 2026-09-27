import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../placeholderRoute'

const loadAuth = () => import('@/features/auth')

/**
 * Sign-in and related routes (phase 1). Session handling and route protection (ProtectedRoute/RoleGuard)
 * are TBD until the auth API contract and role values are available.
 */
export const authRoutes: RouteObject[] = [
  pageRoute(paths.login, { title: 'Đăng nhập', phase: 1 }, async () => (await loadAuth()).LoginPage),
  pageRoute(paths.register, { title: 'Đăng ký tài khoản', phase: 1 }, async () => (await loadAuth()).RegisterPage),
  pageRoute(
    paths.forgotPassword,
    { title: 'Quên mật khẩu?', phase: 1 },
    async () => (await loadAuth()).ForgotPasswordPage,
  ),
  pageRoute(
    paths.pendingConfirmation,
    { title: 'Tài khoản đang chờ xác nhận', phase: 1 },
    async () => (await loadAuth()).PendingConfirmationPage,
  ),
]
