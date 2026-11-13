import { afterEach, describe, expect, it, vi } from 'vitest'
import { getStoredDensityMode, getStoredViewMode, setStoredDensityMode, setStoredViewMode } from './viewStorage'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('music library view storage', () => {
  it('defaults, remembers a choice, and ignores a foreign value', () => {
    expect(getStoredViewMode()).toBe('index')
    expect(getStoredDensityMode()).toBe('comfortable')
    setStoredViewMode('table')
    setStoredDensityMode('compact')
    expect(getStoredViewMode()).toBe('table')
    expect(getStoredDensityMode()).toBe('compact')
    localStorage.setItem('harmonia:music-library:view', 'grid')
    expect(getStoredViewMode()).toBe('index')
  })

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setStoredViewMode('table')).not.toThrow()
    expect(getStoredViewMode()).toBe('index')
  })
})
