import { render, screen } from '@testing-library/react'
import { Button } from 'antd'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('explains what is empty and shows the optional action', () => {
    render(
      <EmptyState
        title="Chưa có tài khoản nào"
        description="Tạo tài khoản đầu tiên để bắt đầu."
        action={<Button type="primary">Tạo tài khoản</Button>}
      />,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chưa có tài khoản nào' })).toBeInTheDocument()
    expect(screen.getByText('Tạo tài khoản đầu tiên để bắt đầu.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeInTheDocument()
  })

  it('renders without an action', () => {
    render(<EmptyState title="Chưa có dữ liệu" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
