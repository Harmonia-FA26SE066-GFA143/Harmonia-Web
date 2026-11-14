import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import dayjs from 'dayjs'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import * as daysApi from '@/features/liturgical-programs/api/liturgicalDaysApi'
import * as programsApi from '@/features/liturgical-programs/api/programsApi'
import * as registrationsApi from '@/features/member-registrations/api/memberRegistrationsApi'
import * as notificationsApi from '@/features/notifications/api/notificationsApi'
import * as profileApi from '@/features/profile/api/profileApi'
import * as settingsApi from '@/features/settings/api/settingsApi'
import * as skillsApi from '@/features/skill-approval/api/memberSkillsApi'
import { clearSession, setSession } from '@/lib/auth/session'
import { AppShell } from './AppShell'
import { programPage } from '@/test/programs'

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
  return router
}

afterEach(() => {
  vi.restoreAllMocks()
  clearSession()
})

describe('AppShell', () => {
  it('shows the running head for the role workspace in the URL and marks the current area and page', async () => {
    setViewportWidth(1280)
    renderShellAt('/director/rehearsals')

    const areas = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(areas).getByRole('link', { name: 'Hoạt động ca đoàn' })).toHaveAttribute('aria-current', 'true')
    expect(within(areas).queryByText('Quản trị hệ thống')).toBeNull()
    const pages = screen.getByRole('navigation', { name: 'Các trang của Hoạt động ca đoàn' })
    expect(within(pages).getByRole('link', { name: 'Lịch tập' })).toHaveAttribute('aria-current', 'page')
    expect(within(pages).queryByText('Tài khoản')).toBeNull()
    expect(screen.getByText('Nội dung trang')).toBeInTheDocument()
  })

  it('shows how many requests wait beside their tab, read with its name', async () => {
    setViewportWidth(1440)
    const list = vi.spyOn(registrationsApi, 'listRegistrations').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 1, totalCount: 3, totalPages: 3 })
    renderShellAt('/admin/accounts')

    const pages = await screen.findByRole('navigation', { name: 'Các trang của Quản trị hệ thống' })
    expect(await within(pages).findByRole('link', { name: 'Đăng ký gia nhập 3 đang chờ' })).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith('', 1, 1)
    expect(within(pages).getByRole('link', { name: 'Tài khoản' })).toBeInTheDocument()
  })

  it('marks an area with something waiting, and shows today’s season and the next Mass in the ivory band', async () => {
    setViewportWidth(1440)
    const today = dayjs().format('YYYY-MM-DD')
    vi.spyOn(skillsApi, 'listPendingSkills').mockResolvedValue({ items: [], pageNumber: 1, pageSize: 1, totalCount: 2, totalPages: 2 })
    vi.spyOn(daysApi, 'listLiturgicalDays').mockResolvedValue([{ date: today, celebrationName: 'Thứ Năm', seasonKey: 'OrdinaryTime', seasonName: 'Mùa Thường Niên' }])
    vi.spyOn(programsApi, 'listPrograms').mockResolvedValue(
      programPage(
        { id: 'p9', eventName: 'Lễ Các Thánh', date: dayjs().add(9, 'day').format('YYYY-MM-DD'), time: '17:30' },
        { id: 'p3', eventName: 'Lễ Chúa Nhật', date: dayjs().add(3, 'day').format('YYYY-MM-DD'), time: '07:30' },
      ),
    )
    renderShellAt('/director/rehearsals')

    const areas = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(await within(areas).findByRole('link', { name: 'Ca viên có việc đang chờ' })).toBeInTheDocument()
    expect(within(areas).getByRole('link', { name: 'Hoạt động ca đoàn' })).toBeInTheDocument()
    const pages = screen.getByRole('navigation', { name: 'Các trang của Hoạt động ca đoàn' })
    expect(await within(pages).findByText('Mùa Thường Niên')).toBeInTheDocument()
    // The nearest one, not the first listed.
    expect(await within(pages).findByRole('link', { name: /^Thánh lễ kế tiếp: Lễ Chúa Nhật/ })).toHaveAttribute('href', '/director/programs/p3')
  })

  it('lets the Choir Director pick the choir they work in, kept in this browser', async () => {
    setViewportWidth(1440)
    vi.spyOn(choirsApi, 'listChoirs').mockResolvedValue([
      { id: 'c1', name: 'Ca đoàn Cecilia', isActive: true },
      { id: 'c2', name: 'Ca đoàn Thiếu nhi', isActive: true },
      { id: 'c3', name: 'Ca đoàn cũ', isActive: false },
    ])
    renderShellAt('/director/rehearsals')

    const picker = await screen.findByRole('combobox', { name: 'Ca đoàn đang làm việc' })
    expect(screen.getByText('Tất cả ca đoàn')).toBeInTheDocument()
    fireEvent.mouseDown(picker)
    // Only the choirs still active are offered.
    expect(await screen.findByRole('option', { name: 'Ca đoàn Thiếu nhi' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Ca đoàn cũ' })).toBeNull()
    fireEvent.click(screen.getByRole('option', { name: 'Ca đoàn Thiếu nhi' }))
    expect(localStorage.getItem('harmonia:current-choir')).toBe('c2')
    localStorage.removeItem('harmonia:current-choir')
  })

  it('offers the role workspaces on role-neutral pages', async () => {
    setViewportWidth(1280)
    renderShellAt('/profile')

    const nav = await screen.findByRole('navigation', { name: 'Các trang của Không gian làm việc' })
    expect(within(nav).getByText('Quản trị hệ thống')).toBeInTheDocument()
    expect(within(nav).getByText('Ca trưởng')).toBeInTheDocument()
  })

  it("keeps the signed-in user's own navigation on role-neutral pages", async () => {
    setViewportWidth(1280)
    setSession({
      accessToken: 'access',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'chaxu@giaoxu.org', fullName: 'Cha xứ', roleName: 'ParishPriest' },
    })
    renderShellAt('/profile')

    const nav = await screen.findByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(nav).getByText('Phụng vụ & lịch')).toBeInTheDocument()
    expect(within(nav).queryByText('Quản trị hệ thống')).toBeNull()
  })

  it('moves the navigation into a drawer on small screens', async () => {
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

  it('opens the page of what a notification is about, read or not, inside the reader’s workspace', async () => {
    setViewportWidth(1280)
    setSession({
      accessToken: 'access',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'cathy@giaoxu.org', roleName: 'ChoirDirector' },
    })
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(1)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [
        { id: 'n1', title: 'Sự kiện mới được công bố', content: 'Lễ Chúa Nhật', createdAt: '2026-10-08T02:00:00Z', isRead: false, referenceType: 'LiturgicalEvent', referenceId: 'e1' },
        { id: 'n2', title: 'Có đăng ký gia nhập mới', content: 'Của Admin', createdAt: '2026-10-07T02:00:00Z', isRead: true, referenceType: 'MemberRegistration', referenceId: 'r1' },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 2,
      totalPages: 1,
    })
    const markRead = vi.spyOn(notificationsApi, 'markNotificationRead').mockResolvedValue()
    const router = renderShellAt('/director')

    fireEvent.click(await screen.findByRole('button', { name: 'Thông báo, 1 chưa đọc' }))
    // A subject of another role's workspace has no page here: the read notification stays plain text.
    expect((await screen.findByText('Có đăng ký gia nhập mới')).closest('button')).toBeNull()
    fireEvent.click(screen.getByText('Sự kiện mới được công bố'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/director/programs/e1'))
    expect(markRead).toHaveBeenCalledWith('n1')
    expect(screen.getByRole('button', { name: /^Thông báo/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the review of the event a song-list notification is about', async () => {
    setViewportWidth(1280)
    setSession({
      accessToken: 'access',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'refresh',
      user: { id: 'u2', email: 'cha@giaoxu.org', roleName: 'ParishPriest' },
    })
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(0)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [{ id: 'n1', title: 'Danh sách bài hát chờ duyệt', content: 'Lễ Chúa Nhật', createdAt: '2026-10-08T02:00:00Z', isRead: true, referenceType: 'SongList', referenceId: 'l1' }],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    })
    // The reference is the list's id; the page goes by its event.
    const eventOf = vi.spyOn(notificationsApi, 'getSongListEventId').mockResolvedValue('e7')
    const router = renderShellAt('/priest')

    fireEvent.click(await screen.findByRole('button', { name: 'Thông báo' }))
    fireEvent.click(await screen.findByText('Danh sách bài hát chờ duyệt'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/priest/programs/e7/song-review'))
    expect(eventOf).toHaveBeenCalledWith('l1')
  })

  it('opens the notifications as a dialog next to the bell; only unread ones are buttons; Escape closes it', async () => {
    setViewportWidth(1280)
    vi.spyOn(notificationsApi, 'countUnreadNotifications').mockResolvedValue(1)
    vi.spyOn(notificationsApi, 'listNotifications').mockResolvedValue({
      items: [
        { id: 'n1', title: 'Sự kiện mới được công bố', content: 'Chưa đọc', createdAt: '2026-10-08T02:00:00Z', isRead: false },
        { id: 'n2', title: 'Sự kiện đã bị hủy', content: 'Đã đọc', createdAt: '2026-10-07T02:00:00Z', isRead: true },
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
    expect(within(dialog).queryByRole('button', { name: /Sự kiện đã bị hủy/ })).toBeNull()
    expect(within(dialog).getByText('Sự kiện đã bị hủy')).toBeInTheDocument()

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
