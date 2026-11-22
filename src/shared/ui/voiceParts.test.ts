import { describe, expect, it } from 'vitest'
import { countVoiceParts, hasVoicePart, inVoicePart, voiceParts } from './voiceParts'

describe('voiceParts', () => {
  it('detects Latin and Vietnamese voice-part skill names accurately', () => {
    expect(inVoicePart(['Soprano'], voiceParts[0].pattern)).toBe(true)
    expect(inVoicePart(['Nữ cao'], voiceParts[0].pattern)).toBe(true)
    expect(inVoicePart(['Nam trầm'], voiceParts[3].pattern)).toBe(true)
    expect(hasVoicePart(['Đệm đàn organ'])).toBe(false)
    expect(hasVoicePart(['Alto', 'Lĩnh xướng'])).toBe(true)
  })

  it('normalizes NFD Vietnamese voice names and rejects substring/instrument collisions', () => {
    expect(inVoicePart(['N\u01b0\u0303 cao'], voiceParts[0].pattern)).toBe(true)
    expect(inVoicePart(['Giọng nữ cao'], voiceParts[0].pattern)).toBe(true)
    expect(inVoicePart(['Contralto'], voiceParts[1].pattern)).toBe(false)
    expect(inVoicePart(['Countertenor'], voiceParts[2].pattern)).toBe(false)
    expect(inVoicePart(['Double bass'], voiceParts[3].pattern)).toBe(false)
    expect(inVoicePart(['Bass guitar'], voiceParts[3].pattern)).toBe(false)
    expect(hasVoicePart(['Double bass', 'Contralto'])).toBe(false)
  })

  it('computes real counts and explicit unassigned (Chưa phân bè) count over full dataset (R2.6)', () => {
    const members = [
      { id: '1', skills: ['Soprano'] },
      { id: '2', skills: ['Nữ trầm', 'Lĩnh xướng'] },
      { id: '3', skills: ['Đệm đàn organ'] },
      { id: '4', skills: [] },
      { id: '5', skills: ['Tenor', 'Bass'] },
    ]
    const dist = countVoiceParts(members, (m) => m.skills)
    expect(dist).toEqual({
      Soprano: 1,
      Alto: 1,
      Tenor: 1,
      Bass: 1,
      unassigned: 2,
      total: 5,
    })
  })
})
