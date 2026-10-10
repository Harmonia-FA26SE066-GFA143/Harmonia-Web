import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelEvent,
  createEvent,
  getEvent,
  getPreparationStatus,
  listEvents,
  publishEvent,
  updateEvent,
  type EventPage,
} from '../api/eventsApi'
import type { EventFilters, EventFormValues } from '../types'

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

export const useCreateEvent = () => useEventMutation((values: EventFormValues) => createEvent(values))

export const useUpdateEvent = () =>
  useEventMutation(({ id, values }: { id: string; values: EventFormValues }) => updateEvent(id, values))

export const usePublishEvent = () => useEventMutation((id: string) => publishEvent(id))

export const useCancelEvent = () => useEventMutation((id: string) => cancelEvent(id))
