import { describe, expect, it } from 'vitest'
import { hasActiveSongFilters, listSearchOf, readSongListState, writeSongListState } from './songFilters'

describe('song list state in the URL', () => {
  it('round-trips every filter and the page', () => {
    const filters = {
      search: 'Thánh Thể',
      seasonId: 's1',
      massTypeId: 'm1',
      ceremonyTypeId: 'c1',
      themeId: 't1',
      slotId: 'sl1',
      skillId: 'k1',
      classified: 'no' as const,
      missingMaterial: 'lyrics' as const,
    }
    expect(readSongListState(writeSongListState(filters, 4))).toEqual({ filters, page: 4 })
  })

  it('ignores unknown classified and material values', () => {
    const { filters, page } = readSongListState(new URLSearchParams('classified=maybe&missingMaterial=video&page=0'))
    expect(filters.classified).toBeUndefined()
    expect(filters.missingMaterial).toBeUndefined()
    expect(page).toBe(1)
  })
})

describe('hasActiveSongFilters', () => {
  it('ignores a blank search', () => {
    expect(hasActiveSongFilters({ search: '   ' })).toBe(false)
    expect(hasActiveSongFilters({ search: 'a' })).toBe(true)
    expect(hasActiveSongFilters({ search: '', themeId: 't1' })).toBe(true)
  })
})

describe('listSearchOf', () => {
  it('reads the list query from router state, else empty', () => {
    expect(listSearchOf({ listSearch: '?page=2' })).toBe('?page=2')
    expect(listSearchOf(null)).toBe('')
    expect(listSearchOf({ listSearch: 2 })).toBe('')
  })
})
