import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../placeholderRoute'

/** Public pages rendered outside the application shell (Stitch SHARED-04). */
export const publicRoutes: RouteObject[] = [
  pageRoute(
    paths.home,
    { title: 'Điều phối ca đoàn và quản lý âm nhạc phụng vụ', phase: 1 },
    async () => (await import('@/app/pages/LandingPage')).LandingPage,
  ),
]

/** Pages inside the application shell that every web role uses (Stitch SHARED-05). */
export const sharedRoutes: RouteObject[] = [
  pageRoute(
    paths.profile,
    { title: 'Hồ sơ cá nhân', phase: 1 },
    async () => (await import('@/features/profile')).ProfilePage,
  ),
]
