import type { ReactNode } from 'react'
import { isPlanningDirector, useEventChoirs } from '@/features/choirs'
import { useRehearsalChoirNames } from '../hooks/useRehearsalChoirNames'
import type { Rehearsal } from '../types'

/** The rehearsing choir(s) as one line of text, or nothing while unknown. */
export function RehearsalChoirs({ rehearsal }: Readonly<{ rehearsal: Pick<Rehearsal, 'isJoint' | 'eventId' | 'choirId'> }>) {
  const names = useRehearsalChoirNames(rehearsal)
  return names && names.length > 0 ? <>{names.join(', ')}</> : null
}

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
 * The actions that change a session or take its attendance. Every director of a serving choir sees a joint
 * rehearsal, but only the lead choir's director changes it or reads and records its attendance
 * (ChoirScopeServiceExtensions.CheckCanManageRehearsalAsync, RehearsalAttendanceService), so the others get none.
 */
export function PlannerOnly({ rehearsal, children }: Readonly<{ rehearsal: Pick<Rehearsal, 'isJoint' | 'eventId' | 'canManage'>; children: ReactNode }>) {
  // The backend says it on the rehearsal itself (RehearsalDto.CanManage, B62): no second request, no flicker.
  if (rehearsal.canManage !== undefined) return rehearsal.canManage ? children : null
  if (!rehearsal.isJoint || !rehearsal.eventId) return children
  return <LeadOnly eventId={rehearsal.eventId}>{children}</LeadOnly>
}
