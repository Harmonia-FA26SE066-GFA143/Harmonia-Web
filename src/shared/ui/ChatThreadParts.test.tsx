import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatDateDivider, ChatHeader } from './ChatThreadParts'
import { formatChatDateLabel } from './chatDateLabel'

describe('ChatThreadParts', () => {
  it('renders opaque ChatHeader with partner name, subtitle, and liveStatus slot (G4-02, G4-03)', () => {
    const { container } = render(
      <ChatHeader
        partnerName="Cha Giuse Nguyễn Văn An"
        subtitle="Cha xứ"
        liveStatus={<output className="notes-live is-live">Trực tiếp</output>}
      />,
    )
    const header = container.querySelector('.chat-header')
    expect(header).not.toBeNull()
    expect(screen.getByText('Cha Giuse Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Cha xứ')).toBeInTheDocument()
    expect(header).toContainElement(screen.getByText('Trực tiếp'))
  })

  it('formats date dividers as Hôm nay, Hôm qua, and DD/MM/YYYY', () => {
    const now = '2026-11-19T10:00:00Z'
    expect(formatChatDateLabel('2026-11-19T08:00:00Z', now)).toBe('Hôm nay')
    expect(formatChatDateLabel('2026-11-18T08:00:00Z', now)).toBe('Hôm qua')
    expect(formatChatDateLabel('2026-11-10T08:00:00Z', now)).toBe('10/11/2026')

    render(<ChatDateDivider date="2026-11-19T08:00:00Z" now={now} />)
    expect(screen.getByRole('separator', { name: 'Hôm nay' })).toBeInTheDocument()
  })

  it('parses Z-less backend UTC timestamps via parseUtc and guards invalid dates', () => {
    expect(formatChatDateLabel('2026-11-19T18:00:00', '2026-11-20T00:30:00+07:00')).toBe('Hôm nay')
    expect(formatChatDateLabel('')).toBe('')
    expect(formatChatDateLabel('not-a-date')).toBe('')

    render(<ChatDateDivider date="" />)
    expect(screen.queryByRole('separator')).toBeNull()
  })
})
