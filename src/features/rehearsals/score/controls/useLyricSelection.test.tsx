import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseTimemap } from '../timeline/parseTimemap'
import { LyricSelector } from './LyricSelector'
import { readLyrics, useLyricSelection } from './useLyricSelection'

const spies = vi.hoisted(() => ({ build: vi.fn() }))
vi.mock('../lyrics', async (importOriginal) => {
  const real = await importOriginal<typeof import('../lyrics')>()
  return {
    ...real,
    createActiveSyllableIndex: (...args: Parameters<typeof real.createActiveSyllableIndex>) => {
      spies.build()
      return real.createActiveSyllableIndex(...args)
    },
  }
})

const meiOf = (body: string) => `<mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score>
<scoreDef><staffGrp>
  <staffDef n="1"><label>Nữ cao</label></staffDef>
  <staffDef n="2"><label>Nam trầm</label></staffDef>
  <staffDef n="3"><label>Đệm</label></staffDef>
</staffGrp></scoreDef>
<section><measure>${body}</measure></section></score></mdiv></body></music></mei>`

const SUNG = meiOf(`
  <staff n="1"><layer n="1"><note xml:id="a"><verse n="1"><syl xml:id="s1a">Ca</syl></verse><verse n="2"><syl xml:id="s2a">Hát</syl></verse></note></layer></staff>
  <staff n="2"><layer n="1"><note xml:id="b"><verse n="1"><syl xml:id="sb">Mừng</syl></verse></note></layer></staff>
  <staff n="3"><layer n="1"><note xml:id="c"/></layer></staff>`)
const UNSUNG = meiOf(`<staff n="3"><layer n="1"><note xml:id="c"/></layer></staff>`)
const timeline = parseTimemap([
  { tstamp: 0, on: ['a', 'b', 'c'] },
  { tstamp: 1000, off: ['a', 'b', 'c'] },
])

afterEach(() => spies.build.mockClear())

describe('readLyrics', () => {
  it('is null for a score without lyrics, and for broken MEI', () => {
    expect(readLyrics(UNSUNG, timeline)).toBeNull()
    expect(readLyrics('<mei', timeline)).toBeNull()
  })
})

describe('useLyricSelection', () => {
  const lyrics = readLyrics(SUNG, timeline)

  it('offers nothing when there are no lyrics', () => {
    const { result } = renderHook(() => useLyricSelection(null, 'x.mxl'))
    expect(result.current).toMatchObject({ parts: [], verses: [], index: null })
  })

  it('lists only parts with lyrics and starts on the first one and its first verse', () => {
    const { result } = renderHook(() => useLyricSelection(lyrics, 'x.mxl'))
    expect(result.current.parts).toEqual([
      { partKey: 'nu-cao', label: 'Nữ cao' },
      { partKey: 'nam-tram', label: 'Nam trầm' },
    ])
    expect(result.current.verses).toEqual(['1', '2'])
    expect(result.current.selection).toEqual({ partKey: 'nu-cao', verse: '1' })
    expect(result.current.index?.at(0.5)).toEqual(['s1a'])
  })

  it('choosing a part or a verse rebuilds the index once and lights that lyric', () => {
    const { result } = renderHook(() => useLyricSelection(lyrics, 'x.mxl'))
    spies.build.mockClear()
    act(() => result.current.chooseVerse('2'))
    expect(spies.build).toHaveBeenCalledTimes(1)
    expect(result.current.index?.at(0.5)).toEqual(['s2a'])
    act(() => result.current.choosePart('nam-tram'))
    expect(spies.build).toHaveBeenCalledTimes(2)
    // Nam trầm has no verse 2: it falls back to its first verse.
    expect(result.current.selection).toEqual({ partKey: 'nam-tram', verse: '1' })
    expect(result.current.verses).toEqual(['1'])
    expect(result.current.index?.at(0.5)).toEqual(['sb'])
  })

  it('does not rebuild the index on a render that changes nothing', () => {
    const { rerender } = renderHook(() => useLyricSelection(lyrics, 'x.mxl'))
    spies.build.mockClear()
    rerender()
    expect(spies.build).not.toHaveBeenCalled()
  })

  it('another score resets the choice', () => {
    const { result, rerender } = renderHook(({ key }) => useLyricSelection(lyrics, key), { initialProps: { key: 'x.mxl' } })
    act(() => result.current.choosePart('nam-tram'))
    rerender({ key: 'y.mxl' })
    expect(result.current.selection).toEqual({ partKey: 'nu-cao', verse: '1' })
  })
})

describe('LyricSelector', () => {
  const parts = [
    { partKey: 'nu-cao', label: 'Nữ cao' },
    { partKey: 'nam-tram', label: 'Nam trầm' },
  ]

  it('renders nothing when there is nothing to choose', () => {
    const { container } = render(
      <LyricSelector parts={[parts[0]]} verses={['1']} selection={{ partKey: 'nu-cao', verse: '1' }} onPart={vi.fn()} onVerse={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows only the verse choice for one part with several verses', () => {
    render(<LyricSelector parts={[parts[0]]} verses={['1', '2']} selection={{ partKey: 'nu-cao', verse: '1' }} onPart={vi.fn()} onVerse={vi.fn()} />)
    expect(screen.queryByRole('combobox', { name: 'Lời của bè' })).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Khổ lời' })).toBeInTheDocument()
  })

  it('names both choices and can be used from the keyboard', () => {
    const onPart = vi.fn()
    render(<LyricSelector parts={parts} verses={['1', '2']} selection={{ partKey: 'nu-cao', verse: '1' }} onPart={onPart} onVerse={vi.fn()} />)
    const part = screen.getByRole('combobox', { name: 'Lời của bè' })
    expect(screen.getByRole('combobox', { name: 'Khổ lời' })).toBeInTheDocument()
    expect(screen.getByText('Nữ cao')).toBeInTheDocument()
    act(() => part.focus())
    fireEvent.keyDown(part, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 })
    fireEvent.keyDown(part, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 })
    fireEvent.keyDown(part, { key: 'Enter', code: 'Enter', keyCode: 13 })
    expect(onPart).toHaveBeenCalledWith('nam-tram', expect.anything())
  })
})
