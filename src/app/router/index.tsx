import { createBrowserRouter, type RouteObject } from 'react-router'
import { NotFoundPage } from '@/app/pages/NotFoundPage'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { BlankLayout } from '@/layouts/BlankLayout/BlankLayout'
import { PageSkeleton } from '@/shared/ui'
import { layout, spacing } from '@/styles/tokens'
import { PageTitle } from './PageTitle'
import { RoleGuard } from './RoleGuard'
import { adminRoutes } from './routes/admin.routes'
import { authRoutes } from './routes/auth.routes'
import { directorRoutes } from './routes/director.routes'
import { priestRoutes } from './routes/priest.routes'
import { publicRoutes, sharedRoutes } from './routes/shared.routes'

export const routes: RouteObject[] = [
  {
    element: <PageTitle />,
    // Shown while the first lazily loaded page resolves.
    hydrateFallbackElement: (
      <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto', padding: `${spacing.xl}px ${layout.contentPaddingX}px` }}>
        <PageSkeleton />
      </div>
    ),
    children: [
      { element: <BlankLayout />, children: [...publicRoutes, ...authRoutes] },
      {
        element: <RoleGuard />,
        children: [
          { element: <AppShell />, children: [...sharedRoutes, ...priestRoutes, ...directorRoutes, ...adminRoutes] },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
