import { describe, expect, it } from 'vitest'
import { savedId } from './savedRow'

describe('savedId', () => {
  it('takes the saved record id, else the id in the variables', () => {
    expect(savedId({ id: 'a1', name: 'x' }, { id: 'b2' })).toBe('a1')
    expect(savedId(undefined, 'b2')).toBe('b2')
    expect(savedId(undefined, { id: 'c3', reason: 'x' })).toBe('c3')
    expect(savedId(204, { reason: 'x' })).toBeUndefined()
  })
})
