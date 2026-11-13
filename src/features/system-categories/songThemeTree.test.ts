import { describe, expect, it } from 'vitest'
import { themePath, themeTreeData, themeWithDescendants } from './songThemeTree'

const themes = [
  { id: 'b', name: 'Thánh Thể', parentId: 'a' },
  { id: 'a', name: 'Kính Chúa', parentId: null },
  { id: 'c', name: 'Chầu', parentId: 'b' },
  { id: 'd', name: 'Ăn năn' },
  { id: 'e', name: 'Mồ côi', parentId: 'gone' },
]

describe('themeTreeData', () => {
  it('nests by parent, sorts by Vietnamese name, and lifts orphans to the top', () => {
    expect(themeTreeData(themes, (theme) => theme.id === 'c')).toEqual([
      { value: 'd', title: 'Ăn năn' },
      {
        value: 'a',
        title: 'Kính Chúa',
        children: [{ value: 'b', title: 'Thánh Thể', children: [{ value: 'c', title: 'Chầu', disabled: true }] }],
      },
      { value: 'e', title: 'Mồ côi' },
    ])
  })
})

describe('themePath', () => {
  it('names the themes from the top down', () => {
    expect(themePath(themes, 'c')).toBe('Kính Chúa › Thánh Thể › Chầu')
    expect(themePath(themes, 'e')).toBe('Mồ côi')
    expect(themePath(themes, 'missing')).toBe('')
  })
})

describe('themeWithDescendants', () => {
  it('collects every theme below, at any depth', () => {
    expect(themeWithDescendants(themes, 'a')).toEqual(new Set(['a', 'b', 'c']))
    expect(themeWithDescendants(themes, 'c')).toEqual(new Set(['c']))
  })
})
