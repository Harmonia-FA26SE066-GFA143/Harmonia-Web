import { describe, expect, it } from 'vitest'
import { dueText } from './programFilters'
import type { LiturgicalProgram } from './types'

const program = (patch: Partial<LiturgicalProgram>): LiturgicalProgram => ({
  id: 'p1',
  eventName: 'Lễ Chúa Nhật',
  date: '2026-11-20',
  time: '07:30',
  locationName: 'Nhà thờ chính',
  status: 'published',
  songListDueDate: '2026-11-13',
  ...patch,
})

describe('dueText', () => {
  it('counts the days left, says today, and says how late a list still to send is', () => {
    expect(dueText(program({}), '2026-11-10')).toEqual({ text: 'Hạn gửi 13/11 · còn 3 ngày', late: false })
    expect(dueText(program({}), '2026-11-13')).toEqual({ text: 'Hạn gửi hôm nay', late: false })
    expect(dueText(program({}), '2026-11-15')).toEqual({ text: 'Quá hạn gửi 2 ngày', late: true })
  })

  it('says nothing once the list is sent, or for a cancelled or past program', () => {
    expect(dueText(program({ songListStatus: 'submitted' }), '2026-11-10')).toBeUndefined()
    expect(dueText(program({ status: 'cancelled' }), '2026-11-10')).toBeUndefined()
    expect(dueText(program({}), '2026-11-21')).toBeUndefined()
  })
})
