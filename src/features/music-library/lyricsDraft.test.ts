import { afterEach, describe, expect, it, vi } from 'vitest'
import { readLyricsDraft, removeLyricsDraft, saveLyricsDraft } from './lyricsDraft'

afterEach(() => {
  vi.useRealTimers()
  sessionStorage.clear()
})

describe('lyrics draft', () => {
  it('keeps a draft per song and material until removed', () => {
    saveLyricsDraft('s1', 'm1', 'Lời bài hát')
    expect(readLyricsDraft('s1', 'm1')).toBe('Lời bài hát')
    expect(readLyricsDraft('s1', 'm2')).toBeUndefined()
    removeLyricsDraft('s1', 'm1')
    expect(readLyricsDraft('s1', 'm1')).toBeUndefined()
  })

  it('drops a draft older than two hours', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-12T08:00:00Z'))
    saveLyricsDraft('s1', 'm1', 'Lời')
    vi.setSystemTime(new Date('2026-11-12T09:59:59Z'))
    expect(readLyricsDraft('s1', 'm1')).toBe('Lời')
    vi.setSystemTime(new Date('2026-11-12T10:00:00Z'))
    expect(readLyricsDraft('s1', 'm1')).toBeUndefined()
    expect(sessionStorage.length).toBe(0)
  })

  it('treats an unreadable draft as none', () => {
    sessionStorage.setItem('harmonia.draft.lyrics.s1.m1', '{broken')
    expect(readLyricsDraft('s1', 'm1')).toBeUndefined()
  })
})
