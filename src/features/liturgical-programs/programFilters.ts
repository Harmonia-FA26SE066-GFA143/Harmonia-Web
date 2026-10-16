import dayjs from 'dayjs'
import { eventStatusLabels, type EventFilters, type EventStatus } from './types'

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
