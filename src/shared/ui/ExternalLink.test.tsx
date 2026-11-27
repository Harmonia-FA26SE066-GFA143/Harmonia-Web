import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExternalLink } from './ExternalLink'

describe('ExternalLink', () => {
  it('opens safely in a new tab with aria-description and external icon', () => {
    render(<ExternalLink href="https://example.com/score">Xem tài liệu tham khảo</ExternalLink>)

    const link = screen.getByRole('link', { name: 'Xem tài liệu tham khảo' })
    expect(link).toHaveAttribute('href', 'https://example.com/score')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('aria-description', 'Mở trong tab mới')
    expect(link).toHaveClass('hm-external-link')
    expect(link.querySelector('svg')).not.toBeNull()
  })

  it('supports inheriting parent colour and hiding the icon', () => {
    render(
      <ExternalLink href="https://example.com/license" inheritColor showIcon={false}>
        LGPL-3.0
      </ExternalLink>,
    )

    const link = screen.getByRole('link', { name: 'LGPL-3.0' })
    expect(link).toHaveClass('hm-external-link', 'hm-external-link--inherit')
    expect(link).toHaveAttribute('aria-description', 'Mở trong tab mới')
    expect(link.querySelector('svg')).toBeNull()
  })
})
