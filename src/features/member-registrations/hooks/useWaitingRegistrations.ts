import { useQuery } from '@tanstack/react-query'
import { listRegistrations } from '../api/memberRegistrationsApi'

export const registrationsKey = ['member-registrations'] as const

/** Every request waits until it is accepted or deleted, so the total is the number waiting. Accept and delete refresh it. */
export function useWaitingRegistrationCount() {
  return useQuery({ queryKey: [...registrationsKey, 'count'], queryFn: () => listRegistrations('', 1, 1) }).data?.totalCount
}
