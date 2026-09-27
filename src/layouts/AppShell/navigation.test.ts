import { describe, expect, it } from 'vitest'
import { findSelectedPath, getSurface, surfaces } from './navigation'

describe('getSurface', () => {
  it('derives the role workspace from the URL prefix', () => {
    expect(getSurface('/admin')).toBe('admin')
    expect(getSurface('/priest/programs/42')).toBe('priest')
    expect(getSurface('/director/rehearsals')).toBe('director')
  })

  it('returns undefined for role-neutral or look-alike paths', () => {
    expect(getSurface('/profile')).toBeUndefined()
    expect(getSurface('/administrator')).toBeUndefined()
  })
})

describe('findSelectedPath', () => {
  it('selects the dashboard only on its own path', () => {
    expect(findSelectedPath(surfaces.admin.sections, '/admin')).toBe('/admin')
    expect(findSelectedPath(surfaces.admin.sections, '/admin/accounts')).toBe('/admin/accounts')
  })

  it('keeps the list item selected on nested detail pages', () => {
    expect(findSelectedPath(surfaces.priest.sections, '/priest/programs/42/song-review')).toBe('/priest/programs')
  })
})
