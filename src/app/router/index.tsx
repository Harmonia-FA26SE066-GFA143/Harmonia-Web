import { createBrowserRouter, type RouteObject } from 'react-router'
import { ErrorPage } from '@/app/pages/ErrorPage'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { BlankLayout } from '@/layouts/BlankLayout/BlankLayout'
import { RoseSpinner } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { PageTitle } from './PageTitle'
import { AuthGuard, MaybeAppShellNotFound, RoleGuard } from './RoleGuard'
import { adminRoutes } from './routes/admin.routes'
import { authRoutes } from './routes/auth.routes'
import { directorRoutes } from './routes/director.routes'
import { priestRoutes } from './routes/priest.routes'
import { publicRoutes, sharedRoutes } from './routes/shared.routes'

export const routes: RouteObject[] = [
  {
    element: <PageTitle />,
    // A page that throws shows a Vietnamese error page instead of React Router's default screen.
    errorElement: <ErrorPage />,
    // Shown while the app opens or reloads and its first lazily loaded page resolves. The layout to come is not known
    // yet (landing, sign-in or a workspace), so a centred rose spinner rather than a page skeleton (owner 2026-11-04).
    hydrateFallbackElement: (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: colors.background }}>
        <RoseSpinner label="Đang mở Harmonia…" />
      </div>
    ),
    children: [
      // The landing page runs edge to edge, so it skips the padded blank frame.
      ...publicRoutes,
      { element: <BlankLayout />, children: authRoutes },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                errorElement: <ErrorPage inShell />,
                children: [
                  ...sharedRoutes,
                  {
                    element: <RoleGuard />,
                    children: [...priestRoutes, ...directorRoutes, ...adminRoutes],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <MaybeAppShellNotFound /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
