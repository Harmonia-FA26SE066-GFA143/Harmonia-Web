import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import * as notificationsApi from '@/features/notifications/api/notificationsApi'
import * as profileApi from '@/features/profile/api/profileApi'
import * as settingsApi from '@/features/settings/api/settingsApi'
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

  it("keeps the signed-in user's own sidebar on role-neutral pages", async () => {
    setViewportWidth(1280)
    setSession({
      accessToken: 'access',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'chaxu@giaoxu.org', fullName: 'Cha xứ', roleName: 'ParishPriest' },
    })
    renderShellAt('/profile')

    const nav = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(nav).getByText('Lịch phụng vụ')).toBeInTheDocument()
    expect(within(nav).queryByText('Quản trị hệ thống')).toBeNull()
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

    fireEvent.click(await screen.findByRole('button', { name: /Menu người dùng/ }))
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

    const menu = await screen.findByRole('button', { name: /Menu người dùng/ })
    expect(await within(menu).findByText('Cecilia Trần Thu Hà')).toBeInTheDocument()
    expect(within(menu).getByText('Ca trưởng')).toBeInTheDocument()
  })

  it('shows unread notifications with the title the backend writes and marks one read when opened', async () => {
    setViewportWidth(1280)
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(2)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [
        {
          id: 'n1',
          title: 'Sự kiện mới được công bố',
          content: 'Sự kiện ngày 24/10/2026 lúc 18:00 đã được công bố.',
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

  it('opens the notifications as a dialog next to the bell; only unread ones are buttons; Escape closes it', async () => {
    setViewportWidth(1280)
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(1)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [
        { id: 'n1', title: 'Sự kiện mới được công bố', content: 'Chưa đọc', createdAt: '2026-10-08T02:00:00Z', isRead: false },
        { id: 'n2', title: 'Sự kiện đã bị huỷ', content: 'Đã đọc', createdAt: '2026-10-07T02:00:00Z', isRead: true },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
    })
    renderShellAt('/director')

    const bell = await screen.findByRole('button', { name: 'Thông báo, 1 chưa đọc' })
    expect(bell).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(bell)

    const dialog = await screen.findByRole('dialog', { name: 'Thông báo' })
    expect(bell).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('tooltip')).toBeNull()
    // Inside the bell's wrapper, so Tab goes from the bell into the panel.
    expect(bell.parentElement).toContainElement(dialog)
    expect(await within(dialog).findByRole('button', { name: /Sự kiện mới được công bố/ })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Sự kiện đã bị huỷ/ })).toBeNull()
    expect(within(dialog).getByText('Sự kiện đã bị huỷ')).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(bell).toHaveAttribute('aria-expanded', 'false')
    expect(bell).toHaveFocus()
  })

  it('says so when a notification cannot be marked read', async () => {
    setViewportWidth(1280)
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(1)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [{ id: 'n1', title: 'Sự kiện mới được công bố', content: 'Chưa đọc', createdAt: '2026-10-08T02:00:00Z', isRead: false }],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    })
    vi.spyOn(notificationsApi, 'markNotificationRead').mockRejectedValue(new Error('x'))
    renderShellAt('/director')

    fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 1 chưa đọc' }))
    fireEvent.click(await screen.findByText('Sự kiện mới được công bố'))

    expect(await screen.findByText('Không thể đánh dấu đã đọc. Vui lòng thử lại.')).toBeInTheDocument()
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

  it('shows the system announcement the Admin set', async () => {
    setViewportWidth(1280)
    vi.spyOn(settingsApi, 'getPublicSettings').mockResolvedValue({ announcement: 'Tuần này tạm ngưng tập thứ Năm.' })
    renderShellAt('/profile')

    expect(await screen.findByText('Tuần này tạm ngưng tập thứ Năm.')).toBeInTheDocument()
    expect(screen.getByText('Nội dung trang')).toBeInTheDocument()
  })
})
