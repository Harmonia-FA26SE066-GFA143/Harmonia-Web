import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NoFilterResults } from './NoFilterResults'

describe('NoFilterResults', () => {
  it('shows the default message and clears filters on click', () => {
    const onClearFilters = vi.fn()
    render(<NoFilterResults onClearFilters={onClearFilters} />)

    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Xoá bộ lọc/ }))
    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })

  it('hides the clear button when no handler is given', () => {
    render(<NoFilterResults title="Không tìm thấy tài khoản phù hợp" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
