import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import * as authApi from '@/features/auth/api/authApi'
import * as notificationsApi from '@/features/notifications/api/notificationsApi'
import * as profileApi from '@/features/profile/api/profileApi'
import { clearSession, setSession, type ApiRoleName } from '@/lib/auth/session'
import { routes } from '.'
import { isPageHandle, type PageHandle } from './pageRoute'

const roleByPrefix: [string, ApiRoleName][] = [
  ['/admin', 'Admin'],
  ['/priest', 'ParishPriest'],
  ['/director', 'ChoirDirector'],
]

/** Role whose workspace contains the path; role-neutral pages (Hồ sơ cá nhân) accept any web role. */
function roleFor(path: string): ApiRoleName {
  return roleByPrefix.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? 'Admin'
}

function signInAs(roleName: ApiRoleName, isPasswordChangeRequired = false) {
  setSession({
    accessToken: 'access',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    refreshToken: 'refresh',
    user: { id: 'user-1', email: 'user@example.com', roleName, isPasswordChangeRequired },
  })
}

// Routing tests must not reach a network: every API call answers 404 at once, so wired pages settle on their
// not-found or error state instead of retrying a failed connection.
beforeEach(() => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 404 })))
})

afterEach(() => {
  clearSession()
  vi.unstubAllGlobals()
})

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

describe('router', () => {
  it('registers a page route for every screen-map page', () => {
    // 31 screen-map pages, the target of the emailed reset link (/reset-password), /change-password and the Choir
    // Director's members (FE-24), skill approval (FE-25) and choirs (D7), the Admin's choirs (D8), and the two sides of
    // the Parish Priest's notes (FE-23), the public request to join with its Admin list, and director nominations for
    // the three roles, plus the focused assignment-creation route.
    expect(pages).toHaveLength(46)
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length)
  })

  it.each(pages)('renders the page for $path', async ({ path, handle }) => {
    signInAs(roleFor(path))
    // ?token= opens the reset-password form; the other pages ignore it.
    renderAt(`${path.replace(/:\w+/g, 'demo')}?token=demo`)
    expect(await screen.findByRole('heading', { level: 1, name: handle.title }, { timeout: 5000 })).toBeInTheDocument()
  })

  it('wraps internal pages in the app shell', async () => {
    signInAs('Admin')
    renderAt('/admin/accounts')
    expect(await screen.findByRole('button', { name: /Menu người dùng/ })).toBeInTheDocument()
  })

  it('renders public pages without the app shell', async () => {
    renderAt('/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Menu người dùng/ })).toBeNull()
    await waitFor(() => expect(document.title).toBe('Đăng nhập · Harmonia'))
  })

  it('renders the not-found page outside shell for anonymous visitors', async () => {
    renderAt('/does-not-exist')
    expect(await screen.findByText('Lỗi 404')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Menu người dùng/ })).toBeNull()
  })

  it('renders the not-found page inside AppShell when signed in and returns to the role workspace', async () => {
    signInAs('ChoirDirector')
    const router = createMemoryRouter(routes, { initialEntries: ['/does-not-exist-auth'] })
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )
    expect(await screen.findByText('Lỗi 404')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Menu người dùng/ })).toBeInTheDocument()
    expect(document.querySelectorAll('main')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Về trang chủ' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/director'))
  })

  it('keeps AppShell mounted with a single main landmark when a shell child route throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    signInAs('ChoirDirector')
    const Broken = () => {
      throw new Error('child route exploded')
    }
    const rootChildren = routes[0].children ?? []
    const authBranch = rootChildren.find((r) => r.children?.some((c) => c.children?.some((g) => g.errorElement)))!
    const shellRoute = authBranch.children![0]
    const errorGroup = shellRoute.children![0]
    const withBroken = (node: RouteObject, children: RouteObject[]): RouteObject =>
      ({ ...node, index: false, children }) as RouteObject
    const testRoutes: RouteObject[] = [
      withBroken(routes[0], [
        ...rootChildren.filter((r) => r !== authBranch),
        withBroken(authBranch, [
          withBroken(shellRoute, [
            withBroken(errorGroup, [...(errorGroup.children ?? []), { path: '/director/boom', Component: Broken }]),
          ]),
        ]),
      ]),
    ]
    const router = createMemoryRouter(testRoutes, { initialEntries: ['/director/boom'] })
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )

    expect(await screen.findByText('Đã xảy ra lỗi')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Menu người dùng/ })).toBeInTheDocument()
    expect(document.querySelectorAll('main')).toHaveLength(1)
    vi.mocked(console.error).mockRestore()
  })

  it('shows a Vietnamese error page when a page throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Broken = () => {
      throw new Error('render failed')
    }
    const router = createMemoryRouter([{ errorElement: routes[0].errorElement, children: [{ path: '/broken', Component: Broken }] }], {
      initialEntries: ['/broken'],
    })
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )
    expect(await screen.findByText('Đã xảy ra lỗi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải lại trang' })).toBeInTheDocument()
    vi.mocked(console.error).mockRestore()
  })
})

describe('route guard', () => {
  it('sends a visitor without a session to sign-in', async () => {
    renderAt('/admin/accounts')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('sends a user who still has the emailed first password to change it', async () => {
    signInAs('ParishPriest', true)
    renderAt('/priest/programs')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đổi mật khẩu' })).toBeInTheDocument()
    expect(screen.getByText(/mật khẩu được gửi qua email/)).toBeInTheDocument()
  })

  it('sends a Choir Member to sign-in, since members use the mobile app', async () => {
    signInAs('ChoirMember')
    renderAt('/profile')
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it.each([
    ['ChoirDirector', '/admin/accounts', 'Hoạt động ca đoàn', 'Tài khoản'],
    ['Admin', '/priest/programs', 'Người dùng', 'Lịch phụng vụ'],
    ['ParishPriest', '/director', 'Phụng vụ & lịch', 'Kho bài hát'],
  ] as const)('shows 403 inside AppShell with own navigation when %s opens %s', async (roleName, path, ownArea, foreignItem) => {
    signInAs(roleName)
    renderAt(path)
    expect(await screen.findByText('Lỗi 403')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Về trang của tôi' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Menu người dùng/ })).toBeInTheDocument()
    const nav = screen.queryByRole('navigation', { name: 'Điều hướng chính' })
    if (nav) {
      expect(within(nav).getByText(ownArea)).toBeInTheDocument()
      expect(within(nav).queryByText(foreignItem)).toBeNull()
    }
  })

  it('hosts voluntary /change-password inside AppShell with full navigation and profile link', async () => {
    signInAs('ChoirDirector', false)
    renderAt('/change-password')

    expect(await screen.findByRole('heading', { level: 1, name: 'Đổi mật khẩu' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Menu người dùng/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quay lại hồ sơ cá nhân' })).toHaveAttribute('href', '/profile')
  })

  it('redirects unauthenticated visitors on /change-password to /login with zero shell queries', async () => {
    const profileSpy = vi.spyOn(profileApi, 'getMyProfile')
    const notifSpy = vi.spyOn(notificationsApi, 'countUnreadNotifications')

    renderAt('/change-password')

    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Menu người dùng/ })).toBeNull()
    expect(profileSpy).not.toHaveBeenCalled()
    expect(notifSpy).not.toHaveBeenCalled()
  })

  it('keeps /change-password mounted inside AppShell in Focused Security Mode and emits zero shell queries after submit + scroll', async () => {
    signInAs('ParishPriest', true)
    const profileSpy = vi.spyOn(profileApi, 'getMyProfile')
    const notifSpy = vi.spyOn(notificationsApi, 'countUnreadNotifications')
    vi.spyOn(authApi, 'changePassword').mockImplementation(async () => {
      clearSession({ passwordChanged: true })
    })
    renderAt('/change-password')

    expect(await screen.findByRole('heading', { level: 1, name: 'Đổi mật khẩu' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Menu người dùng/ })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính' })).toBeNull()
    expect(profileSpy).not.toHaveBeenCalled()
    expect(notifSpy).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'OldPass123' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'NewPass123' } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'NewPass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Đã đổi mật khẩu' })).toBeInTheDocument()
    fireEvent.scroll(window, { target: { scrollY: 100 } })
    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Thông báo/ })).toBeNull()
    expect(profileSpy).not.toHaveBeenCalled()
    expect(notifSpy).not.toHaveBeenCalled()
  })

  // The revoke call is awaited before clearSession(), as in authApi.signOut, so the shell drops the UserMenu (and its
  // SignOutModal) while the mutation is still settling; the guard, not the unmounted modal, must reach /login.
  function stubSignOut() {
    return vi.spyOn(authApi, 'signOut').mockImplementation(async () => {
      await Promise.resolve()
      clearSession()
    })
  }

  it.each([
    ['forced', true],
    ['voluntary', false],
  ])('signs out from the user menu on /change-password (%s) and lands on /login', async (_label, forced) => {
    signInAs('ChoirDirector', forced)
    const signOutSpy = stubSignOut()
    renderAt('/change-password')

    fireEvent.click(await screen.findByRole('button', { name: /Menu người dùng/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: /Đăng xuất/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Đăng xuất khỏi Harmonia?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đăng xuất' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
    expect(signOutSpy).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { level: 1, name: 'Đã đổi mật khẩu' })).toBeNull()
  })

  it('signs out from the forced /change-password page itself and lands on /login', async () => {
    signInAs('ParishPriest', true)
    stubSignOut()
    renderAt('/change-password')

    expect(await screen.findByRole('heading', { level: 1, name: 'Đổi mật khẩu' })).toBeInTheDocument()
    const main = document.getElementById('main-content') as HTMLElement
    fireEvent.click(within(main).getByRole('button', { name: 'Đăng xuất' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument()
  })
})
