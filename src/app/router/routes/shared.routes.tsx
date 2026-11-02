import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../pageRoute'

/** Public pages rendered outside the application shell (Stitch SHARED-04). */
export const publicRoutes: RouteObject[] = [
  pageRoute(
    paths.home,
    { title: 'Mỗi Thánh lễ, một ca đoàn sẵn sàng.' },
    async () => (await import('@/app/pages/LandingPage')).LandingPage,
  ),
]

/** Pages inside the application shell that every web role uses (Stitch SHARED-05). */
export const sharedRoutes: RouteObject[] = [
  pageRoute(
    paths.profile,
    { title: 'Hồ sơ cá nhân' },
    async () => (await import('@/features/profile')).ProfilePage,
  ),
]
