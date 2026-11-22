import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ACTIONS_COLUMN_TITLE } from './glossary'
import { EmptyCell, MissingFileCell, UnassignedVoiceCell } from './TableParts'

describe('TableParts', () => {
  it('exposes canonical Vietnamese table constants and cell placeholders (G2-09, G2-11, R2.6)', () => {
    expect(ACTIONS_COLUMN_TITLE).toBe('Thao tác')
    render(
      <div>
        <EmptyCell />
        <MissingFileCell />
        <UnassignedVoiceCell />
      </div>,
    )
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument()
    expect(screen.getByText('Chưa có')).toBeInTheDocument()
    expect(screen.getByText('Chưa phân bè')).toBeInTheDocument()
  })
})
