import dayjs, { type Dayjs } from 'dayjs'
import type { AttendanceRecord, AttendanceValue } from '@/features/attendance'
import type { PracticeStatus, PracticeSubmission } from '@/features/practice'
import { parseUtc } from '@/lib/api/dates'

export type Granularity = 'week' | 'month' | 'year'

export const granularityLabels: Record<Granularity, string> = { week: 'Tuần', month: 'Tháng', year: 'Năm' }

/** What one bar of the period stands for. */
export const bucketNouns: Record<Granularity, string> = { week: 'ngày', month: 'tuần', year: 'tháng' }

export interface Bucket {
  label: string
  /** Long name for screen readers and tooltips. */
  title: string
}

/** A reporting period: inclusive `YYYY-MM-DD` bounds and the bars it is split into. */
export interface Period {
  granularity: Granularity
  from: string
  to: string
  /** Shown in the toolbar and empty states, e.g. "tuần 06/10 – 12/10/2026". */
  name: string
  buckets: Bucket[]
  /** Index of the bucket a date falls in. */
  bucketOf: (date: Dayjs) => number
}

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const weekdayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật']
/** Monday first, the Vietnamese calendar week. */
const mondayOf = (date: Dayjs) => date.subtract((date.day() + 6) % 7, 'day').startOf('day')
const iso = (date: Dayjs) => date.format('YYYY-MM-DD')

/** The week (Monday to Sunday) by weekday, the month by 7-day weeks (1–7, 8–14, …) and the year by month. */
export function periodOf(granularity: Granularity, anchor: Dayjs): Period {
  if (granularity === 'week') {
    const start = mondayOf(anchor)
    const end = start.add(6, 'day')
    return {
      granularity,
      from: iso(start),
      to: iso(end),
      name: `tuần ${start.format('DD/MM')} – ${end.format('DD/MM/YYYY')}`,
      buckets: weekdays.map((label, index) => ({ label, title: `${weekdayNames[index]} ${start.add(index, 'day').format('DD/MM')}` })),
      bucketOf: (date) => (date.day() + 6) % 7,
    }
  }
  if (granularity === 'month') {
    const start = anchor.startOf('month')
    const days = start.daysInMonth()
    return {
      granularity,
      from: iso(start),
      to: iso(start.endOf('month')),
      name: `tháng ${start.format('MM/YYYY')}`,
      buckets: Array.from({ length: Math.ceil(days / 7) }, (_, index) => {
        const first = index * 7 + 1
        const last = Math.min(first + 6, days)
        return { label: `${first}–${last}`, title: `Ngày ${first} đến ${last}/${start.format('MM')}` }
      }),
      bucketOf: (date) => Math.floor((date.date() - 1) / 7),
    }
  }
  const start = anchor.startOf('year')
  return {
    granularity,
    from: iso(start),
    to: iso(start.endOf('year')),
    name: `năm ${start.format('YYYY')}`,
    buckets: Array.from({ length: 12 }, (_, index) => ({ label: `T${index + 1}`, title: `Tháng ${index + 1}/${start.format('YYYY')}` })),
    bucketOf: (date) => date.month(),
  }
}

const inPeriod = (date: Dayjs, period: Period) => !date.isBefore(period.from, 'day') && !date.isAfter(period.to, 'day')

export type AttendanceCounts = Record<AttendanceValue, number>

const noAttendance = (): AttendanceCounts => ({ present: 0, late: 0, excused: 0, absent: 0 })

export interface MemberAttendance extends AttendanceCounts {
  memberId: string
  fullName: string
  /** Present or late over the sessions the member was marked at; undefined when never marked. */
  rate?: number
}

export interface AttendanceReport {
  /** Sessions that have started; future ones in the period are not counted. */
  sessions: number
  totals: AttendanceCounts
  /** Members not marked at a held session. */
  unmarked: number
  rate?: number
  buckets: AttendanceCounts[]
  /** Lowest attendance first: the members the Choir Director should follow up. */
  members: MemberAttendance[]
}

const rateOf = (counts: AttendanceCounts) => {
  const marked = counts.present + counts.late + counts.excused + counts.absent
  return marked ? (counts.present + counts.late) / marked : undefined
}

/** Totals, per-bar counts and per-member counts of the sessions held in the period. */
export function aggregateAttendance(
  sessions: { startAt: string; records: AttendanceRecord[] }[],
  period: Period,
  now = Date.now(),
): AttendanceReport {
  const totals = noAttendance()
  const buckets = period.buckets.map(noAttendance)
  const members = new Map<string, MemberAttendance>()
  let unmarked = 0
  let held = 0
  for (const { startAt, records } of sessions) {
    const start = dayjs(startAt)
    if (start.valueOf() > now || !inPeriod(start, period)) continue
    held += 1
    const bucket = buckets[period.bucketOf(start)]
    for (const { memberId, fullName, value } of records) {
      const member = members.get(memberId) ?? { memberId, fullName, ...noAttendance() }
      members.set(memberId, member)
      if (!value) {
        unmarked += 1
        continue
      }
      totals[value] += 1
      bucket[value] += 1
      member[value] += 1
    }
  }
  const rows = [...members.values()].map((member) => ({ ...member, rate: rateOf(member) }))
  rows.sort((a, b) => (a.rate ?? 2) - (b.rate ?? 2) || a.fullName.localeCompare(b.fullName, 'vi'))
  return { sessions: held, totals, unmarked, rate: rateOf(totals), buckets, members: rows }
}

export type PracticeCounts = Record<PracticeStatus, number>

const noPractice = (): PracticeCounts => ({ submitted: 0, passed: 0, needsRevision: 0, overdue: 0 })

export interface MemberPractice extends PracticeCounts {
  fullName: string
  total: number
}

export interface PracticeReport {
  total: number
  totals: PracticeCounts
  buckets: PracticeCounts[]
  /** Most work waiting first. */
  members: MemberPractice[]
}

/** Submissions sent in the period (by `submittedAt`), per status, per bar and per member. */
export function aggregatePractice(submissions: PracticeSubmission[], period: Period): PracticeReport {
  const totals = noPractice()
  const buckets = period.buckets.map(noPractice)
  // The submission carries the member's name only.
  const members = new Map<string, MemberPractice>()
  let total = 0
  for (const submission of submissions) {
    const sent = dayjs(parseUtc(submission.submittedAt))
    if (!inPeriod(sent, period)) continue
    total += 1
    totals[submission.status] += 1
    buckets[period.bucketOf(sent)][submission.status] += 1
    const member = members.get(submission.memberName) ?? { fullName: submission.memberName, total: 0, ...noPractice() }
    members.set(submission.memberName, member)
    member.total += 1
    member[submission.status] += 1
  }
  const rows = [...members.values()].sort(
    (a, b) => b.needsRevision + b.submitted - (a.needsRevision + a.submitted) || a.fullName.localeCompare(b.fullName, 'vi'),
  )
  return { total, totals, buckets, members: rows }
}
