import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { clearSession, setSession, type ApiRoleName } from '@/lib/auth/session'
import { routes } from '.'
import { isPageHandle, type PageHandle } from './placeholderRoute'

const roleByPrefix: [string, ApiRoleName][] = [
  ['/admin', 'Admin'],
  ['/priest', 'ParishPriest'],
  ['/director', 'ChoirDirector'],
]

/** Role whose workspace contains the path; role-neutral pages (Hồ sơ cá nhân) accept any web role. */
function roleFor(path: string): ApiRoleName {
  return roleByPrefix.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? 'Admin'
}

function signInAs(roleName: ApiRoleName) {
  setSession({
    accessToken: 'access',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    refreshToken: 'refresh',
    user: { id: 'user-1', email: 'user@example.com', roleName },
  })
}

afterEach(() => clearSession())

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

function collectPages(list: RouteObject[]): { path: string; handle: PageHandle }[] {
  return list.flatMap((route) => [
    ...(route.path && isPageHandle(route.handle) ? [{ path: route.path, handle: route.handle }] : []),
    ...collectPages(route.children ?? []),
  ])
}

const pages = collectPages(routes)
const placeholders = pages.filter((page) => page.handle.placeholder)
const implemented = pages.filter((page) => !page.handle.placeholder)

describe('router', () => {
  it('registers a page route for every screen-map page', () => {
    // 31 screen-map pages plus the target of the emailed reset link (/reset-password).
    expect(pages).toHaveLength(32)
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length)
  })

  it.each(placeholders)('renders the placeholder for $path', async ({ path, handle }) => {
    signInAs(roleFor(path))
    renderAt(path.replace(/:\w+/g, 'demo'))
    expect(await screen.findByRole('heading', { level: 1, name: handle.title })).toBeInTheDocument()
    expect(screen.getByText('Đang phát triển')).toBeInTheDocument()
  })

  it.each(implemented)('renders the implemented page for $path', async ({ path, handle }) => {
    signInAs(roleFor(path))
    // ?token= opens the reset-password form; the other pages ignore it.
    renderAt(`${path.replace(/:\w+/g, 'demo')}?token=demo`)
    expect(await screen.findByRole('heading', { level: 1, name: handle.title })).toBeInTheDocument()
    expect(screen.queryByText('Đang phát triển')).toBeNull()
  })

  it('wraps internal pages in the app shell', async () => {
    signInAs('Admin')
    renderAt('/admin/accounts')
    expect(await screen.findByRole('button', { name: 'Menu người dùng' })).toBeInTheDocument()
  })

  it('renders public pages without the app shell', async () => {
    renderAt('/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu người dùng' })).toBeNull()
  })

  it('renders the not-found page for unknown routes', async () => {
    renderAt('/does-not-exist')
    expect(await screen.findByText('404')).toBeInTheDocument()
  })
})

describe('route guard', () => {
  it('sends a visitor without a session to sign-in', async () => {
    renderAt('/admin/accounts')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('sends a Choir Member to sign-in, since members use the mobile app', async () => {
    signInAs('ChoirMember')
    renderAt('/profile')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it.each([
    ['ChoirDirector', '/admin/accounts'],
    ['Admin', '/priest/programs'],
    ['ParishPriest', '/director'],
  ] as const)('shows 404 when %s opens %s', async (roleName, path) => {
    signInAs(roleName)
    renderAt(path)
    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu người dùng' })).toBeNull()
  })
})
