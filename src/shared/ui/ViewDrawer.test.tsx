import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { spacing } from '@/styles/tokens'
import { ViewDrawer } from './ViewDrawer'

describe('ViewDrawer', () => {
  it('renders right-docked read-only drawer with default 640 tier and "Đóng" button', () => {
    const onClose = vi.fn()
    render(
      <ViewDrawer open title="Hồ sơ ca viên" onClose={onClose}>
        <p>Thông tin chi tiết</p>
      </ViewDrawer>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Hồ sơ ca viên' })
    expect(dialog).toBeInTheDocument()
    expect(dialog.closest('.ant-drawer-right')).not.toBeNull()
    expect(screen.getByText('Thông tin chi tiết')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clamps the 640 tier to the window and keeps the body clearance', () => {
    render(
      <ViewDrawer open title="Chi tiết" onClose={() => {}}>
        <p>Nội dung</p>
      </ViewDrawer>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Chi tiết' })
    const wrapper = dialog.closest<HTMLElement>('.ant-drawer-content-wrapper')
    expect(wrapper?.style.maxWidth).toBe('100vw')
    expect(wrapper).toHaveStyle({ width: '640px' })
    expect(dialog.querySelector('.ant-drawer-body')).toHaveStyle({ paddingBottom: `${spacing.lg}px` })
  })

  it('omits footer when footer={null}', () => {
    render(
      <ViewDrawer open title="Chi tiết" onClose={() => {}} footer={null}>
        <p>Chỉ xem</p>
      </ViewDrawer>,
    )
    expect(screen.queryByRole('button', { name: 'Đóng' })).toBeNull()
  })
})
