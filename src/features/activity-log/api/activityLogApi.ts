import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { ActivityRecord } from '../types'

// `GET /api/audit-logs` (Harmonia-BE AuditLogsController), Admin only: newest first, filtered and paged on the server.

export interface ActivityPage {
  pageNumber: number
  pageSize: number
}

export interface ActivityQuery {
  userId?: string
  entityType?: string
  action?: string
  /** YYYY-MM-DD in Vietnam, inclusive. */
  fromDate?: string
  toDate?: string
}

interface AuditLogDto {
  id: string
  createdAt: string
  userId: string | null
  userFullName: string | null
  userEmail: string | null
  action: string
  entityType: string
  entityId: string | null
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
}

const toRecord = (dto: AuditLogDto): ActivityRecord => ({
  id: dto.id,
  createdAt: dto.createdAt,
  user: dto.userId ? { id: dto.userId, fullName: dto.userFullName ?? undefined, email: dto.userEmail ?? undefined } : undefined,
  action: dto.action,
  entityType: dto.entityType,
  entityId: dto.entityId ?? undefined,
  oldValue: dto.oldValue ?? undefined,
  newValue: dto.newValue ?? undefined,
  ipAddress: dto.ipAddress ?? undefined,
})

export async function listActivityLog(query: ActivityQuery, page: ActivityPage): Promise<PagedList<ActivityRecord>> {
  const result = await apiRequest<PagedList<AuditLogDto>>(`/api/audit-logs${toQuery({ ...query, ...page })}`)
  return { ...result, items: result.items.map(toRecord) }
}
