import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusTag } from './StatusTag'

describe('StatusTag', () => {
  it('pops once when its state changes on screen, not on its first render', () => {
    const { rerender } = render(<StatusTag color="gold">Chờ duyệt</StatusTag>)
    expect(screen.getByText('Chờ duyệt').closest('.ant-tag')).not.toHaveClass('hm-pop')

    rerender(<StatusTag color="green">Đã duyệt</StatusTag>)
    expect(screen.getByText('Đã duyệt').closest('.ant-tag')).toHaveClass('hm-pop')
  })
})
