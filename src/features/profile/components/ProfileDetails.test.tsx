import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import type { Profile } from '../types'
import { ProfileDetails } from './ProfileDetails'

const activeProfile: Profile = {
  fullName: 'Nguyễn Văn An',
  email: 'an@giaoxu.org',
  accountStatus: 'active',
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
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa/ }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('shows the requested role while the account awaits confirmation', () => {
    renderDetails({
      profile: { ...activeProfile, accountStatus: 'pending', role: undefined, requestedRole: 'member' },
    })

    expect(screen.getByText('Chưa được xác nhận (đề nghị: Ca viên)')).toBeInTheDocument()
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
  })

  it('edits only the full name and phone', async () => {
    const { onSave } = renderDetails({ editing: true })

    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Số điện thoại (không bắt buộc)'), { target: { value: '0901234567' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ fullName: 'Nguyễn Văn An', phone: '0901234567' }))
  })

  it('does not save an empty name', async () => {
    const { onSave } = renderDetails({ editing: true })

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    expect(await screen.findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
