import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
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
})
