import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelEvent,
  createEvent,
  generateEvents,
  getEvent,
  getPreparationStatus,
  listEvents,
  publishEvent,
  updateEvent,
  type EventPage,
} from '../api/eventsApi'
import { updateEventChoirs, type EventChoirsValues } from '@/features/choirs'
import { sendParticipationRequests } from '@/features/participation'
import type { EventFilters, EventFormValues, LiturgicalEvent } from '../types'

const eventsKey = ['liturgical-events'] as const

/** One page of events; the previous page stays visible while the next one loads. */
export function useEvents(filters: EventFilters, page: EventPage) {
  return useQuery({
    queryKey: [...eventsKey, 'list', filters, page],
    queryFn: () => listEvents(filters, page),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: string) {
  return useQuery({ queryKey: [...eventsKey, 'event', id], queryFn: () => getEvent(id) })
}

export function usePreparationStatus(id: string) {
  return useQuery({ queryKey: [...eventsKey, 'preparation', id], queryFn: () => getPreparationStatus(id) })
}

/** Every change reloads lists and the event: status, dates and location names come from the backend. */
function useEventMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }) })
}

/**
 * Creates a draft, or a published event (BE 69c9d47), then for a published one invites the members of its serving
 * choirs, like a publish from the detail page. `invited` says what the invitation did.
 */
export const useCreateEvent = () =>
  useEventMutation(async (values: EventFormValues) => {
    const event = await createEvent(values)
    return { event, invited: values.isPublished ? await inviteServingMembers(event.id) : undefined }
  })

export const useUpdateEvent = () =>
  useEventMutation(({ id, values }: { id: string; values: EventFormValues }) => updateEvent(id, values))

/** What an invitation did: members were asked, there was nobody left to ask, or the request failed. */
export type InviteOutcome = 'sent' | 'nobody' | 'failed'

/** Asks every member of the event's serving choirs who has not been asked yet. */
export const inviteServingMembers = (id: string): Promise<InviteOutcome> =>
  sendParticipationRequests(id).then(
    (count) => (count > 0 ? 'sent' : 'nobody'),
    () => 'failed',
  )

/**
 * Publishes, then invites the members of the serving choirs (the Parish Priest may since BE 088f30a; calling again
 * is safe). A failed invitation does not undo the publish: `invited` is 'failed' and the caller offers to send again.
 */
export const usePublishEvent = () =>
  useEventMutation(async (id: string) => {
    await publishEvent(id)
    return { invited: await inviteServingMembers(id) }
  })

export const useCancelEvent = () => useEventMutation((id: string) => cancelEvent(id))

/**
 * Publishes the events one after another and invites their members. A refusal stops that event only; the answer
 * names each refused event with its error.
 */
export const usePublishEvents = () =>
  useEventMutation(async (events: LiturgicalEvent[]) => {
    const refused: { event: LiturgicalEvent; error: Error }[] = []
    let notInvited = 0
    let nobody = 0
    for (const event of events) {
      try {
        await publishEvent(event.id)
        const outcome = await inviteServingMembers(event.id)
        if (outcome === 'failed') notInvited += 1
        if (outcome === 'nobody') nobody += 1
      } catch (error) {
        refused.push({ event, error: error instanceof Error ? error : new Error(String(error)) })
      }
    }
    return { published: events.length - refused.length, notInvited, nobody, refused }
  })

/**
 * Creates the drafts, then gives each one the chosen choirs: the generation request carries no choir (tbd-backlog
 * B55), and a draft without a lead choir cannot be published. `withoutChoirs` counts the drafts whose choirs were
 * refused.
 */
export const useGenerateEvents = () =>
  useEventMutation(async ({ fromDate, toDate, choirs }: { fromDate: string; toDate: string; choirs?: EventChoirsValues }) => {
    const created = await generateEvents(fromDate, toDate)
    let withoutChoirs = 0
    if (choirs?.choirIds.length) {
      // ponytail: one PUT per draft, in order; B55 (choirs on the generation request) replaces the loop.
      for (const event of created) {
        await updateEventChoirs(event.id, choirs).catch(() => {
          withoutChoirs += 1
        })
      }
    }
    return { created, withoutChoirs }
  })
