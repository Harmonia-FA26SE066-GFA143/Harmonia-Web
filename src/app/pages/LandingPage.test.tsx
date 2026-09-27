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

  it('leads to sign-in and registration', async () => {
    renderPage(<LandingPage />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Đăng ký' })[0])
    expect(await screen.findByTestId('location')).toHaveTextContent('/register')
  })
})
