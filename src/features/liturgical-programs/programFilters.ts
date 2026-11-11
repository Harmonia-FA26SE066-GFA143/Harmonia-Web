import dayjs from 'dayjs'
import { canEditSongList, eventStatusLabels, type EventFilters, type EventStatus, type LiturgicalProgram } from './types'

export const formatProgramDate = (date: string) => dayjs(date).format('DD/MM/YYYY')

export const hasActiveEventFilters = (filters: EventFilters) =>
  Boolean(filters.status || filters.fromDate || filters.toDate)

const isoDate = /^\d{4}-\d{2}-\d{2}$/

/** The list state kept in the URL: `?status=&fromDate=&toDate=&page=`; values that do not fit are ignored. */
export function readEventListState(params: URLSearchParams): { filters: EventFilters; page: number } {
  const status = params.get('status')
  const fromDate = params.get('fromDate')
  const toDate = params.get('toDate')
  return {
    filters: {
      status: status && status in eventStatusLabels ? (status as EventStatus) : undefined,
      fromDate: fromDate && isoDate.test(fromDate) ? fromDate : undefined,
      toDate: toDate && isoDate.test(toDate) ? toDate : undefined,
    },
    page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1),
  }
}

export function writeEventListState({ status, fromDate, toDate }: EventFilters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (fromDate) params.set('fromDate', fromDate)
  if (toDate) params.set('toDate', toDate)
  if (page > 1) params.set('page', String(page))
  return params
}

/** The reminder date of a list still to send (BE `songListDueDate`, B44); not enforced, so only words. */
export function dueText(program: LiturgicalProgram, today: string) {
  // Only an upcoming program still to send has a due date worth saying; a cancelled or past one has none.
  if (!program.songListDueDate || !canEditSongList(program.songListStatus) || program.status === 'cancelled' || program.date < today) return undefined
  const days = dayjs(program.songListDueDate).diff(dayjs(today), 'day')
  if (days < 0) return { text: `Quá hạn gửi ${-days} ngày`, late: true }
  return { text: days === 0 ? 'Hạn gửi hôm nay' : `Hạn gửi ${dayjs(program.songListDueDate).format('DD/MM')} · còn ${days} ngày`, late: false }
}
