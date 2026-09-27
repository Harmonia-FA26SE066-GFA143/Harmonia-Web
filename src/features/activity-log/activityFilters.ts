import dayjs from 'dayjs'
import { matchesSearch } from '@/shared/utils/search'
import { activityTypeLabels, type ActivityFilters, type ActivityPeriod, type ActivityRecord } from './types'

export const emptyActivityFilters: ActivityFilters = { search: '' }

export const periodLabels: Record<ActivityPeriod, string> = {
  today: 'Hôm nay',
  last7Days: '7 ngày qua',
  last30Days: '30 ngày qua',
}

function periodStart(period: ActivityPeriod, now = dayjs()) {
  if (period === 'today') return now.startOf('day')
  return now.subtract(period === 'last7Days' ? 7 : 30, 'day')
}

export function hasActiveActivityFilters(filters: ActivityFilters): boolean {
  return Boolean(filters.search.trim() || filters.type || filters.actorName || filters.period)
}

export function filterActivities(records: ActivityRecord[], filters: ActivityFilters): ActivityRecord[] {
  const from = filters.period ? periodStart(filters.period) : undefined
  return records.filter(
    (record) =>
      matchesSearch(filters.search, record.actorName, record.target, record.details, activityTypeLabels[record.type]) &&
      (!filters.type || record.type === filters.type) &&
      (!filters.actorName || record.actorName === filters.actorName) &&
      (!from || !dayjs(record.occurredAt).isBefore(from)),
  )
}

export const formatActivityTime = (iso: string) => dayjs(iso).format('DD/MM/YYYY HH:mm')
