import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeSearchText } from './search'

describe('search', () => {
  it('ignores case and Vietnamese diacritics', () => {
    expect(normalizeSearchText('  Mùa Phục Sinh ')).toBe('mua phuc sinh')
    expect(normalizeSearchText('Simon Phan Văn Đức')).toBe('simon phan van duc')
  })

  it('matches any provided field and treats an empty query as a match', () => {
    expect(matchesSearch('duc', 'Simon Phan Văn Đức', 'vanduc@giaoxu.org')).toBe(true)
    expect(matchesSearch('giaoxu', 'Simon', 'vanduc@giaoxu.org')).toBe(true)
    expect(matchesSearch('alto', 'Soprano', undefined)).toBe(false)
    expect(matchesSearch('   ', 'Soprano')).toBe(true)
  })
})
