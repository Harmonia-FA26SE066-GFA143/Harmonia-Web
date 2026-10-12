import dayjs from 'dayjs'
import { parseUtc, vietnamToday } from '@/lib/api/dates'
import type { ActivityQuery } from './api/activityLogApi'
import { actionLabels, entityTypeLabels, type ActivityFilters, type ActivityPeriod, type ActivityRecord } from './types'

export const emptyActivityFilters: ActivityFilters = {}

export const periodLabels: Record<ActivityPeriod, string> = {
  today: 'Hôm nay',
  last7Days: '7 ngày qua',
  last30Days: '30 ngày qua',
}

const periodDays: Record<ActivityPeriod, number> = { today: 0, last7Days: 6, last30Days: 29 }

export const hasActiveActivityFilters = (filters: ActivityFilters) =>
  Boolean(filters.entityType || filters.action || filters.period || filters.user)

/** The query string of GET /api/audit-logs; periods count whole days in Vietnam, today included. */
export function toActivityQuery({ entityType, action, period, user }: ActivityFilters): ActivityQuery {
  const fromDate = period && dayjs(vietnamToday()).subtract(periodDays[period], 'day').format('YYYY-MM-DD')
  return { entityType, action, fromDate, userId: user?.id }
}

export const formatActivityTime = (createdAt: string) => dayjs(parseUtc(createdAt)).format('DD/MM/YYYY HH:mm')

export const actionLabel = (action: string) => actionLabels[action] ?? action

export const entityLabel = (entityType: string) => entityTypeLabels[entityType] ?? entityType

export const actorName = ({ user }: ActivityRecord) =>
  user ? user.fullName || user.email || 'Người dùng' : 'Không đăng nhập'
