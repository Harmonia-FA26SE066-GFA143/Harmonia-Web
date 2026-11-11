import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../pageRoute'

const loadAuth = () => import('@/features/auth')

/**
 * Sign-in and related routes (phase 1). Accounts are created by an Admin; a visitor can only send a request to join
 * (POST /api/member-registrations), which creates no account. These routes stay outside RoleGuard.
 */
export const authRoutes: RouteObject[] = [
  pageRoute(paths.login, { title: 'Đăng nhập' }, async () => (await loadAuth()).LoginPage),
  pageRoute(paths.join, { title: 'Đăng ký tham gia ca đoàn' }, async () => (await import('@/features/member-registrations')).JoinChoirPage),
  pageRoute(
    paths.forgotPassword,
    { title: 'Quên mật khẩu?' },
    async () => (await loadAuth()).ForgotPasswordPage,
  ),
  pageRoute(
    paths.resetPassword,
    { title: 'Đặt lại mật khẩu' },
    async () => (await loadAuth()).ResetPasswordPage,
  ),
  // Outside RoleGuard so that a user who must change the password can reach it; the page itself needs a session.
  pageRoute(
    paths.changePassword,
    { title: 'Đổi mật khẩu' },
    async () => (await loadAuth()).ChangePasswordPage,
  ),
]
