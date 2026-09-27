import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('validates required fields and email format before submitting', async () => {
    const onSubmit = vi.fn()
    renderPage(<LoginForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText('Vui lòng nhập email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'khong-hop-le' } })
    expect(await screen.findByText('Email không hợp lệ.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the entered credentials', async () => {
    const onSubmit = vi.fn()
    renderPage(<LoginForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'an@giaoxu.org' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'bi-mat' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: 'an@giaoxu.org', password: 'bi-mat' }))
  })

  it.each([
    [{ kind: 'invalid-credentials' } as const, 'Email hoặc mật khẩu không chính xác.'],
    [{ kind: 'unavailable' } as const, 'Không thể đăng nhập lúc này'],
    [{ kind: 'member-web' } as const, 'Tài khoản Ca viên sử dụng ứng dụng di động Harmonia'],
  ])('shows feedback for %o', (feedback, text) => {
    renderPage(<LoginForm onSubmit={vi.fn()} feedback={feedback} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('shows the rejection with its reason', () => {
    renderPage(<LoginForm onSubmit={vi.fn()} feedback={{ kind: 'rejected', reason: 'Không thuộc giáo xứ' }} />)

    expect(screen.getByText('Tài khoản của bạn đã bị từ chối')).toBeInTheDocument()
    expect(screen.getByText('Lý do: Không thuộc giáo xứ')).toBeInTheDocument()
  })
})
