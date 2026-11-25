import { apiRequest } from '@/lib/api/client'
import type { Gender } from '@/shared/utils/personName'
import { toQuery, type PagedList } from '@/lib/api/paging'

// `/api/member-registrations` (Harmonia-BE d74096c, MemberRegistrationsController.cs:16-42): anyone sends a request to
// join; the Admin lists, accepts or deletes. A row exists only while it waits: accepting or deleting removes it.

export interface MemberRegistration {
  id: string
  fullName: string
  email: string
  phone: string | null
  saintName: string | null
  gender?: Gender | null
  note: string | null
  /** The choir the person asked to join (MemberRegistrationDto.cs `PreferredChoirName`, B54); a wish, not a placement. */
  preferredChoirName?: string | null
  createdAt: string
  /**
   * Another waiting request or an existing account with the same phone, or the same full name and saint name (Harmonia-BE
   * 69c9d47, `RegistrationDuplicateDto.cs`, `MemberRegistrationService.cs:90-108`). Only a hint for the Admin.
   */
  possibleDuplicates?: RegistrationDuplicate[]
}

export interface RegistrationDuplicate {
  kind: 'Registration' | 'User'
  id: string
  fullName: string
  email: string
  matchedOn: 'Phone' | 'Name'
}

export interface RegistrationValues {
  fullName: string
  email: string
  phone?: string
  saintName?: string
  gender: Gender
  note?: string
  /** One of `listPublicChoirs`, optional (CreateMemberRegistrationRequest.cs:20-21); a wish the Admin sees. */
  preferredChoirId?: string
}

/** Active choirs a visitor may name in the request (anonymous GET api/choirs/public, ChoirsController.cs:32-37). */
export function listPublicChoirs(): Promise<{ id: string; name: string; description: string | null }[]> {
  return apiRequest('/api/choirs/public')
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

/**
 * Turns a request down with a reason (required, at most 500 characters), which the server emails to the applicant
 * (Harmonia-BE 69c9d47, `MemberRegistrationsController.cs:39-43`, `DeleteMemberRegistrationRequestValidator.cs`,
 * `MemberRegistrationService.cs:183-188`).
 */
export function deleteRegistration({ id, reason }: { id: string; reason: string }): Promise<void> {
  return apiRequest<void>(`/api/member-registrations/${id}`, { method: 'DELETE', body: JSON.stringify({ reason: reason.trim() }) })
}
