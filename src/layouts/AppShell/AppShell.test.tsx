import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import * as notificationsApi from '@/features/notifications/api/notificationsApi'
import * as profileApi from '@/features/profile/api/profileApi'
import { clearSession, setSession } from '@/lib/auth/session'
import { AppShell } from './AppShell'

/** Emulates a viewport width for Ant Design's breakpoint queries. */
function setViewportWidth(width: number) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query)
    const max = /max-width:\s*(\d+)px/.exec(query)
    const matches = (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList
  })
}

function renderShellAt(path: string) {
  const router = createMemoryRouter(
    [{ element: <AppShell />, children: [{ path: '*', element: <p>Nội dung trang</p> }] }],
    { initialEntries: [path] },
  )
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  clearSession()
})

describe('AppShell', () => {
  it('shows the sidebar for the role workspace in the URL and highlights the current page', async () => {
    setViewportWidth(1280)
    renderShellAt('/director/rehearsals')

    const nav = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(nav).getByText('Lịch tập').closest('li')).toHaveClass('ant-menu-item-selected')
    expect(within(nav).queryByText('Tài khoản')).toBeNull()
    expect(screen.getByText('Nội dung trang')).toBeInTheDocument()
  })

  it('offers the role workspaces on role-neutral pages', async () => {
    setViewportWidth(1280)
    renderShellAt('/profile')

    const nav = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(nav).getByText('Quản trị hệ thống')).toBeInTheDocument()
    expect(within(nav).getByText('Ca trưởng')).toBeInTheDocument()
  })

  it('moves the sidebar into a drawer on small screens', async () => {
    setViewportWidth(375)
    renderShellAt('/admin')

    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính' })).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu điều hướng' }))
    const nav = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(nav).getByText('Tài khoản')).toBeInTheDocument()
  })

  it('asks for confirmation before signing out from the user menu', async () => {
    setViewportWidth(1280)
    renderShellAt('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Menu người dùng' }))
    fireEvent.click(await screen.findByText('Đăng xuất'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Đăng xuất khỏi Harmonia?')).toBeInTheDocument()
  })

  it('shows the signed-in name from the profile and the role from the session', async () => {
    setViewportWidth(1280)
    setSession({
      accessToken: 'access',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'cathy@giaoxu.org', fullName: 'Tên cũ', roleName: 'ChoirDirector' },
    })
    vi.spyOn(profileApi, 'getMyProfile').mockResolvedValue({
      fullName: 'Cecilia Trần Thu Hà',
      email: 'cathy@giaoxu.org',
      role: 'director',
    })
    renderShellAt('/profile')

    const menu = await screen.findByRole('button', { name: 'Menu người dùng' })
    expect(await within(menu).findByText('Cecilia Trần Thu Hà')).toBeInTheDocument()
    expect(within(menu).getByText('Ca trưởng')).toBeInTheDocument()
  })

  it('shows unread notifications with Vietnamese titles and marks one read when opened', async () => {
    setViewportWidth(1280)
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(2)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [
        {
          id: 'n1',
          type: 'eventPublished',
          title: 'New event published',
          content: 'The event on 24/10/2026 at 18:00 has been published.',
          createdAt: '2026-10-08T02:00:00Z',
          isRead: false,
        },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    })
    const markRead = vi.spyOn(notificationsApi, 'markNotificationRead').mockResolvedValue()
    renderShellAt('/director')

    fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' }))
    const item = await screen.findByText('Sự kiện mới được công bố')
    expect(screen.getByText('Mới')).toBeInTheDocument()
    fireEvent.click(item)

    await waitFor(() => expect(markRead).toHaveBeenCalledWith('n1'))
  })

  it('marks every notification read at once', async () => {
    setViewportWidth(1280)
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(3)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    })
    const markAll = vi.spyOn(notificationsApi, 'markAllNotificationsRead').mockResolvedValue()
    renderShellAt('/director')

    fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 3 chưa đọc' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Đánh dấu tất cả đã đọc' }))

    await waitFor(() => expect(markAll).toHaveBeenCalled())
  })
})
