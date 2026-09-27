import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import { RegisterForm } from './RegisterForm'

function fillRequiredFields(password = 'mat-khau-1', confirm = 'mat-khau-1') {
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn An' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'an@giaoxu.org' } })
  fireEvent.click(screen.getByLabelText('Ca trưởng'))
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: confirm } })
}

describe('RegisterForm', () => {
  it('offers only the requestable roles (never Admin)', () => {
    renderPage(<RegisterForm onSubmit={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByLabelText('Cha xứ / Ban phụng vụ')).toBeInTheDocument()
    expect(screen.getByLabelText('Ca viên')).toBeInTheDocument()
    expect(screen.queryByLabelText('Quản trị viên')).toBeNull()
  })

  it('requires the mandatory fields', async () => {
    const onSubmit = vi.fn()
    renderPage(<RegisterForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))
    expect(await screen.findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn vai trò mong muốn.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a mismatched password confirmation', async () => {
    const onSubmit = vi.fn()
    renderPage(<RegisterForm onSubmit={onSubmit} />)

    fillRequiredFields('mat-khau-1', 'mat-khau-2')
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid values; phone stays optional', async () => {
    const onSubmit = vi.fn()
    renderPage(<RegisterForm onSubmit={onSubmit} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Nguyễn Văn An', email: 'an@giaoxu.org', requestedRole: 'director' }),
      ),
    )
  })

  it('explains an already registered email', () => {
    renderPage(<RegisterForm onSubmit={vi.fn()} error={{ kind: 'email-taken' }} />)
    expect(screen.getByText('Email này đã được đăng ký.')).toBeInTheDocument()
  })
})
