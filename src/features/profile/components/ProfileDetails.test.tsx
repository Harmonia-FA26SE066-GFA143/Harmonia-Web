import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import type { Profile } from '../types'
import { ProfileDetails } from './ProfileDetails'

const activeProfile: Profile = {
  fullName: 'Nguyễn Văn An',
  email: 'an@giaoxu.org',
  role: 'director',
}

function renderDetails(props: Partial<Parameters<typeof ProfileDetails>[0]> = {}) {
  const handlers = { onEdit: vi.fn(), onCancel: vi.fn(), onSave: vi.fn() }
  renderPage(<ProfileDetails profile={activeProfile} editing={false} {...handlers} {...props} />)
  return handlers
}

describe('ProfileDetails', () => {
  it('shows the profile read-only by default', () => {
    const { onEdit } = renderDetails()

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Ca trưởng')).toBeInTheDocument()
    // Phone and saint name are both empty.
    expect(screen.getAllByText('Chưa cập nhật')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa/ }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('edits only the full name, saint name and phone', async () => {
    const { onSave } = renderDetails({ editing: true })

    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    fireEvent.change(screen.getByLabelText('Số điện thoại (không bắt buộc)'), { target: { value: '0901234567' } })
    fireEvent.change(screen.getByLabelText('Tên thánh (không bắt buộc)'), { target: { value: 'Giuse' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ fullName: 'Nguyễn Văn An', phone: '0901234567', saintName: 'Giuse' }))
  })

  it('keeps the saint name when only the phone is changed, since the backend replaces every field', async () => {
    const { onSave } = renderDetails({ editing: true, profile: { ...activeProfile, saintName: 'Maria' } })

    fireEvent.change(screen.getByLabelText('Số điện thoại (không bắt buộc)'), { target: { value: '0901234567' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ saintName: 'Maria' })))
  })

  it('keeps name and phone within the backend limits', async () => {
    const { onSave } = renderDetails({ editing: true })

    fireEvent.change(screen.getByLabelText('Họ và tên (không bắt buộc)'), { target: { value: 'a'.repeat(101) } })
    fireEvent.change(screen.getByLabelText('Số điện thoại (không bắt buộc)'), { target: { value: '0'.repeat(21) } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Họ và tên tối đa 100 ký tự.')).toBeInTheDocument()
    expect(screen.getByText('Số điện thoại tối đa 20 ký tự.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('allows an empty name, as the backend does', async () => {
    const { onSave } = renderDetails({ editing: true })

    fireEvent.change(screen.getByLabelText('Họ và tên (không bắt buộc)'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ fullName: '' })))
  })
})
