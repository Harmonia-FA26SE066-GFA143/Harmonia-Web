import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers'
import { routes } from '.'
import { isPageHandle, type PageHandle } from './placeholderRoute'

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
    expect(pages).toHaveLength(31)
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length)
  })

  it.each(placeholders)('renders the placeholder for $path', async ({ path, handle }) => {
    renderAt(path.replace(/:\w+/g, 'demo'))
    expect(await screen.findByRole('heading', { level: 1, name: handle.title })).toBeInTheDocument()
    expect(screen.getByText('Đang phát triển')).toBeInTheDocument()
  })

  it.each(implemented)('renders the implemented page for $path', async ({ path, handle }) => {
    renderAt(path.replace(/:\w+/g, 'demo'))
    expect(await screen.findByRole('heading', { level: 1, name: handle.title })).toBeInTheDocument()
    expect(screen.queryByText('Đang phát triển')).toBeNull()
  })

  it('wraps internal pages in the app shell', async () => {
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
