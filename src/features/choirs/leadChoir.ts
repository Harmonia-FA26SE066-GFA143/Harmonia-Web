import { getSession } from '@/lib/auth/session'
import type { EventChoir } from './types'

/**
 * Whether the signed-in Choir Director may plan the event (D8): no lead chosen yet, or they direct the lead choir or
 * stand in for its director at this event (BE ff72860, ChoirScopeService.IsDirectedBy).
 */
/**
 * A choir's name in a picker. The backend lets a choir without a director serve and lead (it only skips the
 * notification), and then nobody can plan the event, so the picker says it.
 */
export const choirOptionLabel = (choir: { name: string; directorId?: string }) =>
  choir.directorId ? choir.name : `${choir.name} (chưa có ca trưởng)`

export const isPlanningDirector = (choirs: EventChoir[], userId = getSession()?.user.id) => {
  const lead = choirs.find((choir) => choir.isLead)
  return !lead || lead.directorId === userId || lead.substituteDirectorId === userId
}
