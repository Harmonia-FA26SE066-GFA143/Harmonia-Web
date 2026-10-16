import dayjs from 'dayjs'
import { vietnamToday } from '@/lib/api/dates'
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


export const actionLabel = (action: string) => actionLabels[action] ?? action

export const entityLabel = (entityType: string) => entityTypeLabels[entityType] ?? entityType

export const actorName = ({ user }: ActivityRecord) =>
  user ? user.fullName || user.email || 'Người dùng' : 'Không đăng nhập'

/** The list state kept in the URL: `?entityType=&action=&period=&userId=&userName=&page=`; unknown values are ignored. */
export function readActivityState(params: URLSearchParams): { filters: ActivityFilters; page: number } {
  const entityType = params.get('entityType') ?? undefined
  const action = params.get('action') ?? undefined
  const period = params.get('period') ?? undefined
  const userId = params.get('userId')
  return {
    filters: {
      entityType: entityType && entityType in entityTypeLabels ? entityType : undefined,
      action: action && action in actionLabels ? action : undefined,
      period: period && period in periodLabels ? (period as ActivityPeriod) : undefined,
      user: userId ? { id: userId, name: params.get('userName') || 'Người dùng' } : undefined,
    },
    page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1),
  }
}

export function writeActivityState({ entityType, action, period, user }: ActivityFilters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (entityType) params.set('entityType', entityType)
  if (action) params.set('action', action)
  if (period) params.set('period', period)
  if (user) {
    params.set('userId', user.id)
    params.set('userName', user.name)
  }
  if (page > 1) params.set('page', String(page))
  return params
}
