import { describe, expect, it } from 'vitest'
import { toQuery } from './paging'

describe('toQuery', () => {
  it('keeps defined, non-empty values, including false and 0', () => {
    expect(toQuery({ pageNumber: 2, keyword: '', status: undefined, isActive: false, offset: 0 })).toBe(
      '?pageNumber=2&isActive=false&offset=0',
    )
  })

  it('is empty when nothing is set, and encodes values', () => {
    expect(toQuery({ keyword: '', status: undefined })).toBe('')
    expect(toQuery({ keyword: 'Kinh Hòa Bình & Tôn vinh' })).toBe('?keyword=Kinh+H%C3%B2a+B%C3%ACnh+%26+T%C3%B4n+vinh')
  })
})
