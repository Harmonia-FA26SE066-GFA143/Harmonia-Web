import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderPage } from '@/test/renderPage'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('introduces the four roles', () => {
    renderPage(<LandingPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mỗi Thánh lễ, một ca đoàn sẵn sàng.')
    const roles = within(screen.getByRole('region', { name: 'Mỗi người một việc, chung một lịch.' }))
    expect(roles.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Cha xứ',
      'Ca trưởng',
      'Ca viên, nhạc công',
      'Quản trị viên',
    ])
  })

  it('leads to sign-in only, as accounts are created by an Admin', async () => {
    renderPage(<LandingPage />)

    expect(screen.queryByRole('button', { name: 'Đăng ký' })).toBeNull()
    const signIn = screen.getAllByRole('link', { name: 'Đăng nhập' })[0]
    expect(signIn).toHaveAttribute('href', '/login')
    fireEvent.click(signIn)
    expect(await screen.findByTestId('location')).toHaveTextContent('/login')
  })

  it('offers the administrators’ email for account requests and support', () => {
    renderPage(<LandingPage />)

    expect(screen.getByRole('link', { name: /Liên hệ/ })).toHaveAttribute('href', 'mailto:harmoniafall26@gmail.com')
    expect(screen.getByRole('heading', { level: 2, name: 'Cần tài khoản cho giáo xứ?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'harmoniafall26@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:harmoniafall26@gmail.com',
    )
  })
})
