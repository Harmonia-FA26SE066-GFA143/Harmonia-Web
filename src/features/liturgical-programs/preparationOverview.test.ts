import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { preparationItems, type PreparationInput } from './preparationOverview'
import type { PreparationStatus } from './types'

const status = (patch: Partial<PreparationStatus> = {}): PreparationStatus => ({
  participation: { invited: 0, confirmed: 0, declined: 0, unsure: 0 },
  rosterActiveAssignments: 0,
  rosterShortages: [],
  rehearsalsTotal: 0,
  rehearsalsHeld: 0,
  attendanceExpected: 0,
  attendancePresent: 0,
  practiceExpected: 0,
  practicePassed: 0,
  practiceOverdue: 0,
  ...patch,
})

const item = (input: Partial<PreparationInput>, label: string) =>
  preparationItems({ date: '2026-11-20', viewer: 'director', ...input }).find((entry) => entry.label === label)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-12T09:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('preparationItems', () => {
  it('lists the six items in order', () => {
    expect(preparationItems({ date: '2026-11-20', viewer: 'priest' }).map((entry) => entry.label)).toEqual([
      'Danh sách bài hát',
      'Cha xứ duyệt',
      'Xác nhận tham gia',
      'Chốt phân công',
      'Tập',
      'Cử hành',
    ])
  })

  it('marks what waits on the viewer', () => {
    expect(item({ songListStatus: 'submitted', viewer: 'director' }, 'Cha xứ duyệt')?.state).toBe('progress')
    expect(item({ songListStatus: 'submitted', viewer: 'priest' }, 'Cha xứ duyệt')?.state).toBe('waiting')
    expect(item({ songListStatus: 'needsRevision', viewer: 'director' }, 'Cha xứ duyệt')?.state).toBe('waiting')
    expect(item({ viewer: 'director' }, 'Danh sách bài hát')).toMatchObject({ value: 'Chưa soạn', state: 'waiting' })
    expect(item({ songListStatus: 'approved' }, 'Danh sách bài hát')?.state).toBe('done')
  })

  it('says loading or a dash while the counts are missing', () => {
    expect(item({}, 'Tập')?.value).toBe('Đang tải…')
    expect(item({ failed: true }, 'Tập')?.value).toBe('—')
  })

  it('counts participation; done once nobody is left to answer', () => {
    expect(item({ status: status() }, 'Xác nhận tham gia')?.value).toBe('Chưa mời')
    expect(item({ status: status({ participation: { invited: 2, confirmed: 3, declined: 1, unsure: 0 } }) }, 'Xác nhận tham gia')).toMatchObject({
      value: '3/6 đã nhận lời',
      state: 'progress',
    })
    expect(item({ status: status({ participation: { invited: 0, confirmed: 3, declined: 1, unsure: 0 } }) }, 'Xác nhận tham gia')?.state).toBe('done')
  })

  it('reports roster shortages before the finalized flag', () => {
    expect(item({ status: status() }, 'Chốt phân công')?.value).toBe('Chưa lập')
    const shortage = { skillName: 'Tenor', requiredCount: 2, assignedCount: 1 }
    expect(item({ status: status({ rosterFinalized: true, rosterShortages: [shortage] }) }, 'Chốt phân công')?.value).toBe('Thiếu 1 vị trí')
    expect(item({ status: status({ rosterFinalized: false }) }, 'Chốt phân công')).toMatchObject({ value: 'Đang soạn', state: 'progress' })
    expect(item({ status: status({ rosterFinalized: true }) }, 'Chốt phân công')).toMatchObject({ value: 'Đã chốt', state: 'done' })
  })

  it('counts rehearsals and adds the practice note', () => {
    expect(item({ status: status({ rehearsalsTotal: 3, rehearsalsHeld: 1, practiceExpected: 4, practicePassed: 2 }) }, 'Tập')).toEqual({
      label: 'Tập',
      value: '1/3 buổi đã tập',
      state: 'progress',
      note: 'Bài tập: 2/4 lượt đạt',
    })
    expect(item({ status: status({ rehearsalsTotal: 2, rehearsalsHeld: 2 }) }, 'Tập')?.state).toBe('done')
  })

  it('counts calendar days to the celebration', () => {
    expect(item({ date: '2026-11-20' }, 'Cử hành')?.value).toBe('Còn 8 ngày')
    expect(item({ date: '2026-11-12' }, 'Cử hành')?.value).toBe('Hôm nay')
    expect(item({ date: '2026-11-11' }, 'Cử hành')).toMatchObject({ value: 'Đã cử hành', state: 'done' })
  })
})
