import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { formatDuration, formatEventOption } from '@/features/practice/practiceFormat'
import { ApiError } from '@/lib/api/errors'
import { formatRehearsalTime, rehearsalLabel } from './rehearsalFormat'
import { rehearsalErrorMessage } from './rehearsalErrors'

beforeAll(() => {
  dayjs.locale('vi')
})

afterAll(() => {
  dayjs.locale('en')
})

describe('rehearsal formatting', () => {
  it('writes the capitalised weekday, date and time range', () => {
    expect(formatRehearsalTime({ startAt: '2026-09-18T19:30:00', endAt: '2026-09-18T21:00:00' })).toBe('Thứ sáu, 18/09/2026 · 19:30–21:00')
  })

  it('labels a session by time and place, the place optional', () => {
    expect(rehearsalLabel({ startAt: '2026-09-18T19:30:00', locationName: 'Phòng tập' })).toBe('18/09 19:30 · Phòng tập')
    expect(rehearsalLabel({ startAt: '2026-09-18T19:30:00', locationName: '' })).toBe('18/09 19:30')
  })
})

describe('practice formatting', () => {
  it('shows a duration as mm:ss, or a dash when unknown', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(65)).toBe('01:05')
  })

  it('names an event with a default title', () => {
    expect(formatEventOption({ title: null, eventDate: '2026-11-15', time: '07:30', locationName: 'Nhà thờ' })).toBe(
      'Sự kiện · 15/11/2026 07:30 · Nhà thờ',
    )
  })
})

describe('rehearsalErrorMessage', () => {
  it('reads a field error code when the main code is unknown', () => {
    expect(
      rehearsalErrorMessage(new ApiError(400, { code: 'VALIDATION_FAILED', errors: { endAt: ['REHEARSAL_TIME_INVALID'] } }), 'fb'),
    ).toBe('Giờ kết thúc phải sau giờ bắt đầu.')
    expect(rehearsalErrorMessage(new Error('x'), 'fb')).toBe('fb')
  })
})
