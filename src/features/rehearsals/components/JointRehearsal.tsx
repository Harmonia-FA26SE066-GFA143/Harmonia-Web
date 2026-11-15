import type { ReactNode } from 'react'
import { isPlanningDirector, useEventChoirs } from '@/features/choirs'
import type { Rehearsal } from '../types'

/** Marks a joint rehearsal of every choir serving the program (BE 69c9d47). */
export function JointChip({ rehearsal }: Readonly<{ rehearsal: Pick<Rehearsal, 'isJoint'> }>) {
  return rehearsal.isJoint ? <span className="hm-chip">Buổi tập chung</span> : null
}

function LeadOnly({ eventId, children }: Readonly<{ eventId: string; children: ReactNode }>) {
  const choirs = useEventChoirs(eventId)
  // Shown while loading and on error: the backend still decides (CHOIR_NOT_LEAD).
  return choirs.data && !isPlanningDirector(choirs.data) ? null : children
}

/**
 * The actions that change a session. Every director of a serving choir sees a joint rehearsal, but only the lead
 * choir's director changes it (ChoirScopeServiceExtensions.CheckCanManageRehearsalAsync), so the others get none.
 */
export function PlannerOnly({ rehearsal, children }: Readonly<{ rehearsal: Pick<Rehearsal, 'isJoint' | 'eventId'>; children: ReactNode }>) {
  if (!rehearsal.isJoint || !rehearsal.eventId) return children
  return <LeadOnly eventId={rehearsal.eventId}>{children}</LeadOnly>
}
