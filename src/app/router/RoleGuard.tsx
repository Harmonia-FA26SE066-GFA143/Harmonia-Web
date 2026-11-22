import { Navigate, Outlet, useLocation } from 'react-router'
import { ForbiddenPage } from '@/app/pages/ForbiddenPage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { getSurface, surfaceByRole, surfaces } from '@/layouts/AppShell/navigation'
import { clearPasswordChangeCompleted, isPasswordChangeCompleted, useSession } from '@/lib/auth/session'
import { paths } from './paths'

/**
 * Verifies a valid signed-in web session before entering `AppShell` (R2.8).
 * - Unauthenticated users (or mobile-only `ChoirMember`) redirect to `/login`.
 * - Exception: `/change-password` stays mounted inside `AppShell` ONLY when `changePassword` just completed in this
 *   tab so `ChangePasswordPage` can render its confirmation state; direct unauthenticated visits redirect immediately
 *   without mounting `AppShell` or firing shell queries.
 * - Users with `isPasswordChangeRequired` redirect to `/change-password`.
 */
export function AuthGuard() {
  const { pathname } = useLocation()
  // Reactive: every clearSession() (sign-out from any button, a dead token) leaves for /login at once, without the
  // caller having to navigate. changePassword() clears with `passwordChanged`, which marks the completion before
  // this re-renders, so /change-password keeps its confirmation.
  const user = useSession()?.user
  const surface = user && surfaceByRole[user.roleName]

  if (pathname === paths.changePassword) {
    if (!user) return isPasswordChangeCompleted() ? <Outlet /> : <Navigate to={paths.login} replace />
    if (!surface) return <Navigate to={paths.login} replace />
    return <Outlet />
  }

  clearPasswordChangeCompleted()
  if (!surface) return <Navigate to={paths.login} replace />
  if (user.isPasswordChangeRequired) return <Navigate to={paths.changePassword} replace />
  return <Outlet />
}

/**
 * Enforces role-workspace isolation inside `AppShell` (issue #25, R2.8). Cross-role URLs render `ForbiddenPage`
 * inside `AppShell` so the signed-in user keeps their own navigation and one-click return path.
 */
export function RoleGuard() {
  const { pathname } = useLocation()
  const user = useSession()?.user
  const surface = user && surfaceByRole[user.roleName]
  if (!surface) return <Navigate to={paths.login} replace />
  if (user.isPasswordChangeRequired) return <Navigate to={paths.changePassword} replace />
  const area = getSurface(pathname)
  if (area && area !== surface) return <ForbiddenPage homePath={surfaces[surface].basePath} inShell />
  return <Outlet />
}

/** Renders 404 inside `AppShell` when a valid web user is signed in, or standalone otherwise (R2.8). */
export function MaybeAppShellNotFound() {
  const user = useSession()?.user
  const surface = user && surfaceByRole[user.roleName]
  const hasWebShell = Boolean(surface && !user.isPasswordChangeRequired)
  return hasWebShell && surface ? (
    <AppShell>
      <NotFoundPage inShell homePath={surfaces[surface].basePath} />
    </AppShell>
  ) : (
    <NotFoundPage />
  )
}
