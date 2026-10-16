import dayjs from 'dayjs'
import type { EventFilters } from './types'

export const formatProgramDate = (date: string) => dayjs(date).format('DD/MM/YYYY')

export const hasActiveEventFilters = (filters: EventFilters) =>
  Boolean(filters.status || filters.fromDate || filters.toDate)

export { vietnamToday } from '@/lib/api/dates'
