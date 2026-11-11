import { act, fireEvent, render, screen } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { describe, expect, it, vi } from 'vitest'
import { ScoreCredit } from './ScoreCredit'
import { LICENSES_URL } from './verovioNotice'

// A chunk that cannot be fetched (offline, or a deploy replaced it): the dialog must say so and point at the official text.
vi.mock('./lgpl-3.0.txt?raw', () => {
  throw new Error('chunk failed to load')
})

describe('ScoreCredit, licence texts that cannot be loaded', () => {
  it('keeps the facts, says the text did not load and links to the official texts', async () => {
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <ScoreCredit />
      </ConfigProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Giấy phép của Verovio' })
    act(() => trigger.focus())
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Giấy phép của Verovio' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được bản văn giấy phép')
    expect(dialog).toHaveTextContent('LGPL-3.0-only')
    expect(dialog.querySelectorAll('pre')).toHaveLength(0)
    expect(screen.getAllByRole('link', { name: LICENSES_URL }).length).toBeGreaterThan(0)
  })
})
