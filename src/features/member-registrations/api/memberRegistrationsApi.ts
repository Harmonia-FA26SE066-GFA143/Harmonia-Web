import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'

// `/api/member-registrations` (Harmonia-BE d74096c, MemberRegistrationsController.cs:16-42): anyone sends a request to
// join; the Admin lists, accepts or deletes. A row exists only while it waits: accepting or deleting removes it.

export interface MemberRegistration {
  id: string
  fullName: string
  email: string
  phone: string | null
  saintName: string | null
  note: string | null
  createdAt: string
}

export interface RegistrationValues {
  fullName: string
  email: string
  phone?: string
  saintName?: string
  note?: string
}

/** Answers 204 even for an email that already has an account, so the form cannot probe who is registered. */
export function submitRegistration(values: RegistrationValues): Promise<void> {
  return apiRequest<void>('/api/member-registrations', { method: 'POST', body: JSON.stringify(values) })
}

export function listRegistrations(keyword: string, pageNumber: number, pageSize: number): Promise<PagedList<MemberRegistration>> {
  return apiRequest(`/api/member-registrations${toQuery({ keyword: keyword.trim(), pageNumber, pageSize })}`)
}

/** Creates the Choir Member account; the server emails the first password. */
export async function acceptRegistration(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-registrations/${id}/accept`, { method: 'POST' })
}

export function deleteRegistration(id: string): Promise<void> {
  return apiRequest<void>(`/api/member-registrations/${id}`, { method: 'DELETE' })
}
