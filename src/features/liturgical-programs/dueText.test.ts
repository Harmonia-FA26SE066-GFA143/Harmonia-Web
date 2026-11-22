import { describe, expect, it } from 'vitest'
import { dueText } from './programFilters'
import type { ProgramListItem } from './types'

const program = (patch: Partial<ProgramListItem>): ProgramListItem => ({
  id: 'p1',
  eventName: 'Lễ Chúa Nhật',
  date: '2026-11-20',
  time: '07:30',
  locationName: 'Nhà thờ chính',
  status: 'published',
  songListDueDate: '2026-11-13',
  isSongListOverdue: false,
  ...patch,
})

describe('dueText', () => {
  it('counts the days left, says today, and says how late a list is when the backend flags it', () => {
    expect(dueText(program({}), '2026-11-10')).toEqual({ text: 'Hạn gửi 13/11 · còn 3 ngày', late: false })
    expect(dueText(program({}), '2026-11-13')).toEqual({ text: 'Hạn gửi hôm nay', late: false })
    expect(dueText(program({ isSongListOverdue: true }), '2026-11-15')).toEqual({ text: 'Quá hạn gửi 2 ngày', late: true })
  })

  it('follows the backend: a submitted list past its due date is still late, and lateness is never guessed', () => {
    expect(dueText(program({ songListStatus: 'submitted', isSongListOverdue: true }), '2026-11-15')).toEqual({ text: 'Quá hạn 2 ngày · chờ duyệt', late: true })
    // Past the date but not flagged by the backend: no "late" invented on the Web.
    expect(dueText(program({}), '2026-11-15')).toBeUndefined()
  })

  it('says nothing once the list is sent on time, or for a cancelled or past program', () => {
    expect(dueText(program({ songListStatus: 'submitted' }), '2026-11-10')).toBeUndefined()
    expect(dueText(program({ status: 'cancelled' }), '2026-11-10')).toBeUndefined()
    expect(dueText(program({}), '2026-11-21')).toBeUndefined()
  })
})
