import { describe, expect, it } from 'vitest'
import { parseTieMap } from './tieMap'

const mei = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score><section><measure>${body}</measure></section></score></mdiv></body></music></mei>`

describe('parseTieMap', () => {
  it('builds one group from a single tie', () => {
    const ties = parseTieMap(mei('<tie xml:id="t1" startid="#a" endid="#b"/>'))

    expect(ties.get('a')).toEqual({ tieGroupId: 'a', isTieContinuation: false, members: ['a', 'b'] })
    expect(ties.get('b')).toEqual({ tieGroupId: 'a', isTieContinuation: true, members: ['a', 'b'] })
  })

  it('chains A-B-C into one group with order', () => {
    // Listed out of order on purpose: the chain must follow startid -> endid, not document order.
    const ties = parseTieMap(mei('<tie startid="#b" endid="#c"/><tie startid="#a" endid="#b"/>'))

    expect(ties.size).toBe(3)
    for (const id of ['a', 'b', 'c']) {
      expect(ties.get(id)).toMatchObject({ tieGroupId: 'a', members: ['a', 'b', 'c'] })
    }
  })

  it('marks only non-first members as continuation', () => {
    const ties = parseTieMap(mei('<tie startid="#a" endid="#b"/><tie startid="#b" endid="#c"/>'))

    expect(['a', 'b', 'c'].map((id) => ties.get(id)?.isTieContinuation)).toEqual([false, true, true])
  })

  it('keeps separate groups apart', () => {
    const ties = parseTieMap(mei('<tie startid="#a" endid="#b"/><tie startid="#x" endid="#y"/>'))

    expect(ties.get('a')?.tieGroupId).toBe('a')
    expect(ties.get('y')).toMatchObject({ tieGroupId: 'x', members: ['x', 'y'] })
  })

  it('returns empty map when MEI has no ties', () => {
    expect(parseTieMap(mei('<note xml:id="a"/>')).size).toBe(0)
  })

  it('ignores tie with missing startid or endid without throwing', () => {
    const ties = parseTieMap(mei('<tie startid="#a"/><tie endid="#b"/><tie/><tie startid="#c" endid="#d"/>'))

    expect([...ties.keys()]).toEqual(['c', 'd'])
  })
})
