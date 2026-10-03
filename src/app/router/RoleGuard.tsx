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
 * workspace shows 404. Hiding routes is UX only; the backend authorizes every request.
 */
export function RoleGuard() {
  const { pathname } = useLocation()
  const role = getSession()?.user.roleName
  const surface = role && surfaceByRole[role]
  if (!surface) return <Navigate to={paths.login} replace />
  const area = getSurface(pathname)
  if (area && area !== surface) return <NotFoundPage />
  return <Outlet />
}
