import { useChoirs, useEventChoirs } from '@/features/choirs'
import type { Rehearsal } from '../types'

/**
 * The choir(s) that rehearse: the rehearsal's own choir, or on a joint rehearsal every choir serving its program
 * (RehearsalDto.cs: `ChoirId` is null when `IsJoint`; LiturgicalEventsController `GET {id}/choirs`). Undefined while
 * loading, on error, or for a rehearsal made before choirs were scoped (ChoirId null, D8).
 */
export function useRehearsalChoirNames(rehearsal: Pick<Rehearsal, 'isJoint' | 'eventId' | 'choirId'>): string[] | undefined {
  const choirs = useChoirs()
  const eventChoirs = useEventChoirs(rehearsal.isJoint ? rehearsal.eventId : undefined)
  if (rehearsal.isJoint) return eventChoirs.data?.map((choir) => choir.name)
  const own = rehearsal.choirId && choirs.data?.find((choir) => choir.id === rehearsal.choirId)
  return own ? [own.name] : undefined
}
