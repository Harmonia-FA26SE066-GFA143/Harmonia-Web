import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SummaryStrip } from './SummaryStrip'

describe('SummaryStrip', () => {
  it('names each count, shows "—" for an unknown one, and marks a waiting count in words above zero only', () => {
    const { rerender } = render(
      <SummaryStrip
        label="Điểm danh"
        cells={[
          { label: 'Có mặt', value: 12 },
          { label: 'Muộn' },
          { label: 'Chưa điểm danh', value: 3, waiting: 'Còn chờ' },
        ]}
      />,
    )
    expect(screen.getByText('Có mặt').nextElementSibling).toHaveTextContent('12')
    expect(screen.getByText('Muộn').nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('Còn chờ')).toBeInTheDocument()
    expect(screen.getByText('Chưa điểm danh').parentElement).toHaveClass('is-waiting')

    rerender(<SummaryStrip label="Điểm danh" cells={[{ label: 'Chưa điểm danh', value: 0, waiting: 'Còn chờ' }]} />)
    expect(screen.queryByText('Còn chờ')).toBeNull()
    expect(screen.getByText('Chưa điểm danh').parentElement).not.toHaveClass('is-waiting')
  })
})
