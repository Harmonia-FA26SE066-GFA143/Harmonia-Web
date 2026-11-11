import { describe, expect, it } from 'vitest'
import { countStaves } from './countStaves'

describe('countStaves', () => {
  it('counts the staves Verovio defines in its MEI, one per distinct n', () => {
    const def = (n: number, id = `P${n}`) => `<staffDef xml:id="${id}" n="${n}" lines="5" ppq="1">`
    expect(countStaves(`<mei>${def(1)}</mei>`)).toBe(1)
    expect(countStaves(`<mei>${def(1)}${def(2)}</mei>`)).toBe(2)
    expect(countStaves(`<mei>${[1, 2, 3, 4].map((n) => def(n)).join('')}</mei>`)).toBe(4)
    // a later scoreDef (key or clef change) repeats the same staves
    expect(countStaves(`<mei>${def(1)}${def(2)}<section/>${def(1, 'x1')}${def(2, 'x2')}</mei>`)).toBe(2)
  })

  it('an MEI without staff definitions, and words that only start like one, count as none', () => {
    expect(countStaves('<mei/>')).toBe(0)
    expect(countStaves('<mei><staffDefault n="1"/><staffGrp n="2"/></mei>')).toBe(0)
  })
})
