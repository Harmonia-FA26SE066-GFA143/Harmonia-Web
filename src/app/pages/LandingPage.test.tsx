import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderPage } from '@/test/renderPage'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('introduces the four roles', () => {
    renderPage(<LandingPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Điều phối ca đoàn')
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Cha xứ / Hội đồng Phụng vụ',
      'Ca trưởng',
      'Thành viên ca đoàn / Nhạc công',
      'Quản trị viên',
    ])
  })

  it('leads to sign-in only, as accounts are created by an Admin', async () => {
    renderPage(<LandingPage />)

    expect(screen.queryByRole('button', { name: 'Đăng ký' })).toBeNull()
    fireEvent.click(screen.getAllByRole('button', { name: 'Đăng nhập' })[0])
    expect(await screen.findByTestId('location')).toHaveTextContent('/login')
  })

  it('offers the administrators’ email for account requests and support', () => {
    renderPage(<LandingPage />)

    expect(screen.getByRole('link', { name: /Liên hệ/ })).toHaveAttribute('href', 'mailto:harmoniafall26@gmail.com')
    expect(screen.getByRole('heading', { level: 2, name: 'Liên hệ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'harmoniafall26@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:harmoniafall26@gmail.com',
    )
  })
})
