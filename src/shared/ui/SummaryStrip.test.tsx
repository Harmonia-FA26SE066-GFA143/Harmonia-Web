import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SummaryStrip } from './SummaryStrip'

describe('SummaryStrip', () => {
  it('names each count, shows "Chưa có dữ liệu" for unknown values (R2.6), and marks waiting counts above zero only', () => {
    const { rerender } = render(
      <SummaryStrip
        label="Điểm danh"
        cells={[
          { label: 'Có mặt', value: 12 },
          { label: 'Đi trễ' },
          { label: 'Chưa điểm danh', value: 3, waiting: 'Còn chờ' },
        ]}
      />,
    )
    expect(screen.getByText('Có mặt').nextElementSibling).toHaveTextContent('12')
    expect(screen.getByText('Đi trễ').nextElementSibling).toHaveTextContent('Chưa có dữ liệu')
    expect(screen.getByText('Còn chờ')).toBeInTheDocument()
    expect(screen.getByText('Chưa điểm danh').parentElement).toHaveClass('is-waiting')

    rerender(<SummaryStrip label="Điểm danh" cells={[{ label: 'Chưa điểm danh', value: 0, waiting: 'Còn chờ' }]} />)
    expect(screen.getByText('Chưa điểm danh').nextElementSibling).toHaveTextContent('0')
    expect(screen.queryByText('Còn chờ')).toBeNull()
    expect(screen.getByText('Chưa điểm danh').parentElement).not.toHaveClass('is-waiting')

    rerender(
      <SummaryStrip
        label="Điểm danh"
        cells={[
          { label: 'NaN', value: Number.NaN, waiting: 'Còn chờ' },
          { label: 'Null', value: null as unknown as number, waiting: 'Còn chờ' },
          { label: 'Infinity', value: Number.POSITIVE_INFINITY },
        ]}
      />,
    )
    expect(screen.getByText('NaN').nextElementSibling).toHaveTextContent('Chưa có dữ liệu')
    expect(screen.getByText('NaN').parentElement).not.toHaveClass('is-waiting')
    expect(screen.getByText('Null').nextElementSibling).toHaveTextContent('Chưa có dữ liệu')
    expect(screen.getByText('Infinity').nextElementSibling).toHaveTextContent('Chưa có dữ liệu')
  })
})
