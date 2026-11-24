import { fireEvent, render, screen } from '@testing-library/react'
import { Input } from 'antd'
import { describe, expect, it, vi } from 'vitest'
import { FilterBar } from './FilterBar'
import { filterAllPlaceholder } from './glossary'

describe('FilterBar', () => {
  it('shows "Đang tải…" when resultCount is undefined (R2.5) and disables reset when idle', () => {
    render(
      <FilterBar resultCount={undefined} resultNoun="bài hát" hasActiveFilters={false} onReset={() => {}}>
        <Input aria-label="Tìm kiếm" placeholder={filterAllPlaceholder('bài hát')} />
      </FilterBar>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Đang tải…')
    expect(screen.queryByText('Chưa có kết quả')).toBeNull()
    expect(screen.getByRole('button', { name: 'Xoá bộ lọc' })).toBeDisabled()
    expect(screen.getByPlaceholderText('Tất cả bài hát')).toBeInTheDocument()
  })

  it('shows real count and calls onReset when active filters exist', () => {
    const onReset = vi.fn()
    render(
      <FilterBar resultCount={0} resultNoun="ca viên" hasActiveFilters onReset={onReset}>
        <Input aria-label="Tìm kiếm" />
      </FilterBar>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('0 ca viên')
    const reset = screen.getByRole('button', { name: 'Xoá bộ lọc' })
    expect(reset).toBeEnabled()
    fireEvent.click(reset)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('does not show "Đang tải…" when error is true and resultCount is undefined (R2.5)', () => {
    render(
      <FilterBar resultCount={undefined} error resultNoun="bài hát" hasActiveFilters={false} onReset={() => {}}>
        <Input aria-label="Tìm kiếm" />
      </FilterBar>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Không thể tải số liệu')
    expect(screen.queryByText('Đang tải…')).toBeNull()
  })
})
