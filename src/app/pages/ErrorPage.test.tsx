import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorPage } from './ErrorPage'

function renderFailing(loader: () => unknown) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Trang chủ</p> },
      { path: '/broken', loader, element: <p>never</p>, errorElement: <ErrorPage /> },
    ],
    { initialEntries: ['/broken'] },
  )
  return render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorPage', () => {
  it('shows the Vietnamese error screen and goes home', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderFailing(() => {
      throw new Error('chunk gone')
    })
    expect(await screen.findByText('Đã xảy ra lỗi')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Về trang chủ' }))
    expect(await screen.findByText('Trang chủ')).toBeInTheDocument()
  })

  it('keeps the not-found page for a 404 response', async () => {
    renderFailing(() => {
      throw new Response(null, { status: 404 })
    })
    expect(await screen.findByText('404')).toBeInTheDocument()
  })
})
