import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('announces the failure with a Vietnamese default message', () => {
    render(<ErrorState />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Không thể tải dữ liệu' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Thử lại/ })).toBeNull()
  })

  it('calls onRetry when "Thử lại" is clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorState title="Không thể tải danh sách tài khoản" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
