import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageSkeleton, SectionSkeleton } from './PageSkeleton'

describe('PageSkeleton', () => {
  it('exposes a busy status for the whole page and each section', () => {
    render(<PageSkeleton sections={3} />)

    expect(screen.getByRole('status', { name: 'Đang tải trang' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByRole('status', { name: 'Đang tải dữ liệu' })).toHaveLength(3)
  })

  it('renders a section skeleton with a custom label', () => {
    render(<SectionSkeleton label="Đang tải danh sách tài khoản" />)
    expect(screen.getByRole('status', { name: 'Đang tải danh sách tài khoản' })).toBeInTheDocument()
  })
})
