import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Button, Input, type InputRef } from 'antd'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { spacing } from '@/styles/tokens'
import { FormDrawer } from './FormDrawer'

describe('FormDrawer', () => {
  it('renders right-placed drawer with default size 480, cancelText "Hủy", and fires onOk/onCancel', () => {
    const onOk = vi.fn()
    const onCancel = vi.fn()
    render(
      <FormDrawer open title="Thêm buổi tập" okText="Thêm buổi tập" onOk={onOk} onCancel={onCancel}>
        <p>Nội dung biểu mẫu</p>
      </FormDrawer>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Thêm buổi tập' })
    expect(dialog).toBeInTheDocument()
    expect(dialog.closest('.ant-drawer-right')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Thêm buổi tập' }))
    expect(onOk).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('locks close button and cancel button while submitting is busy', () => {
    render(
      <FormDrawer
        open
        title="Lưu"
        okText="Lưu"
        okButtonProps={{ loading: true }}
        onOk={() => {}}
        onCancel={() => {}}
      >
        <p>Đang lưu</p>
      </FormDrawer>,
    )

    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('clamps the 720 tier to the window and keeps the body clearance', () => {
    render(
      <FormDrawer open size={720} title="Sửa" okText="Lưu" onOk={() => {}} onCancel={() => {}}>
        <p>Nội dung</p>
      </FormDrawer>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Sửa' })
    const wrapper = dialog.closest<HTMLElement>('.ant-drawer-content-wrapper')
    expect(wrapper?.style.maxWidth).toBe('100vw')
    expect(wrapper).toHaveStyle({ width: '720px' })
    expect(dialog.querySelector('.ant-drawer-body')).toHaveStyle({ paddingBottom: `${spacing.lg}px` })
  })

  it('focuses initialFocusRef on initial open={true} mount and on false -> true transition (G3-13)', async () => {
    function MountOpenHarness() {
      const ref = useRef<InputRef>(null)
      return (
        <FormDrawer open title="Tạo mới" okText="Tạo mới" onOk={() => {}} onCancel={() => {}} initialFocusRef={ref}>
          <Input ref={ref} aria-label="Tiêu đề" />
        </FormDrawer>
      )
    }
    const { unmount } = render(<MountOpenHarness />)
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveFocus())
    unmount()

    function TransitionHarness() {
      const [open, setOpen] = useState(false)
      const ref = useRef<InputRef>(null)
      return (
        <>
          <Button onClick={() => setOpen(true)}>Mở</Button>
          <FormDrawer open={open} title="Tạo mới" okText="Tạo mới" onOk={() => {}} onCancel={() => setOpen(false)} initialFocusRef={ref}>
            <Input ref={ref} aria-label="Tiêu đề" />
          </FormDrawer>
        </>
      )
    }
    render(<TransitionHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở' }))
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveFocus())
  })
})
