import { Navigate, Outlet, useLocation } from 'react-router'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { getSurface, type Surface } from '@/layouts/AppShell/navigation'
import { getSession, type ApiRoleName } from '@/lib/auth/session'
import { paths } from './paths'

/** Web workspace of each role. Choir Members use the mobile app, so they have none. */
const surfaceByRole: Partial<Record<ApiRoleName, Surface>> = {
  Admin: 'admin',
  ParishPriest: 'priest',
  ChoirDirector: 'director',
}

/**
 * Admits a signed-in web role to the app shell, and only to its own workspace (issue #25). Another role's
 * workspace shows 404. A user who still has the emailed first password goes to change it: the backend refuses
 * everything else until then (issue #51). Hiding routes is UX only; the backend authorizes every request.
 */
export function RoleGuard() {
  const { pathname } = useLocation()
  const user = getSession()?.user
  const surface = user && surfaceByRole[user.roleName]
  if (!surface) return <Navigate to={paths.login} replace />
  if (user.isPasswordChangeRequired) return <Navigate to={paths.changePassword} replace />
  const area = getSurface(pathname)
  if (area && area !== surface) return <NotFoundPage />
  return <Outlet />
}
