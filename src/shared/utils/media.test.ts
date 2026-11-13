import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { dateOnlyFieldProps } from './dateField'
import { clock, fileExtension } from './media'

describe('fileExtension', () => {
  it('returns the last extension, lower-cased, with its dot', () => {
    expect(fileExtension('Kinh Hòa Bình.PDF')).toBe('.pdf')
    expect(fileExtension('score.v2.MusicXML')).toBe('.musicxml')
  })
})

describe('clock', () => {
  it('shows minutes and zero-padded whole seconds', () => {
    expect(clock(0)).toBe('0:00')
    expect(clock(125.9)).toBe('2:05')
    expect(clock(3600)).toBe('60:00')
  })
})

describe('dateOnlyFieldProps', () => {
  it('turns the stored YYYY-MM-DD into a dayjs value and back', () => {
    expect(dateOnlyFieldProps.getValueProps('2026-11-12').value?.format('YYYY-MM-DD')).toBe('2026-11-12')
    expect(dateOnlyFieldProps.normalize(dayjs('2026-01-05T23:30'))).toBe('2026-01-05')
  })

  it('leaves a cleared field undefined', () => {
    expect(dateOnlyFieldProps.getValueProps(null).value).toBeUndefined()
    expect(dateOnlyFieldProps.normalize(null)).toBeUndefined()
  })
})
