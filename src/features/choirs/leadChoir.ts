import { getSession } from '@/lib/auth/session'
import type { EventChoir } from './types'

/** Whether the signed-in Choir Director may plan the event (D8): no lead chosen yet, or the lead choir is theirs. */
export const isPlanningDirector = (choirs: EventChoir[], userId = getSession()?.user.id) => {
  const lead = choirs.find((choir) => choir.isLead)
  return !lead || lead.directorId === userId
}
