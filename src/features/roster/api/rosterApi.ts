import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { toQuery } from '@/lib/api/paging'
import type {
  PersonnelRequirement,
  PersonnelRequirementValue,
  RosterAssignment,
  RosterShortage,
  RosterStatus,
  ServiceRoster,
} from '../types'

// Personnel requirements: per song `/api/song-list-items/{id}/personnel-requirements` (SongListItemsController), for
// the whole service `/api/liturgical-events/{id}/personnel-requirements` (LiturgicalEventsController, BE d1ca63e).
// Roster: `/api/service-rosters` (ServiceRostersController), Choir Director only. Song lines need the approved song
// list; whole-service lines do not (ROSTER_SONG_LIST_NOT_APPROVED only when neither exists). Only members who answered
// Confirmed or Unsure are assigned (ServiceRosterRepository). Program ids are event ids.

type ApiRosterStatus = 'Draft' | 'Suggested' | 'Finalized'

const statusByApi: Record<ApiRosterStatus, RosterStatus> = { Draft: 'draft', Suggested: 'suggested', Finalized: 'finalized' }

export interface PersonnelRequirementDto {
  skillId: string
  skillName: string
  skillCategoryId: string
  requiredCount: number
}

export interface RosterAssignmentDto {
  id: string
  memberId: string
  memberName: string
  skillId: string
  skillName: string
  songListItemId: string | null
  songTitle: string | null
  note: string | null
  source: 'Suggested' | 'Manual'
}

export interface ServiceRosterDto {
  id: string
  eventId: string
  status: ApiRosterStatus
  wholeServiceFinalizedAt: string | null
  assignments: RosterAssignmentDto[]
  shortages: RosterShortage[]
}

export interface RosterSuggestionDto {
  rosterId: string
  eventId: string
  status: ApiRosterStatus
  isAiGenerated: boolean
  assignments: RosterAssignmentDto[]
  shortages: RosterShortage[]
}

const toAssignment = (dto: RosterAssignmentDto): RosterAssignment => ({
  id: dto.id,
  memberId: dto.memberId,
  memberName: dto.memberName,
  skillId: dto.skillId,
  skillName: dto.skillName,
  songListItemId: dto.songListItemId,
  note: dto.note ?? undefined,
  source: dto.source === 'Suggested' ? 'suggested' : 'manual',
})

const toRoster = (
  id: string,
  status: ApiRosterStatus,
  assignments: RosterAssignmentDto[],
  wholeServiceFinalizedAt?: string | null,
): ServiceRoster => ({
  id,
  status: statusByApi[status],
  wholeServiceFinalizedAt: wholeServiceFinalizedAt ?? undefined,
  assignments: assignments.map(toAssignment),
})

export async function getPersonnelRequirements(songListItemId: string): Promise<PersonnelRequirement[]> {
  const dtos = await apiRequest<PersonnelRequirementDto[]>(`/api/song-list-items/${songListItemId}/personnel-requirements`)
  return dtos.map(({ skillId, skillName, requiredCount }) => ({ skillId, skillName, requiredCount }))
}

const toRows = (requirements: PersonnelRequirement[]): PersonnelRequirementValue[] =>
  requirements.map(({ skillId, requiredCount }) => ({ skillId, requiredCount }))

/**
 * Replaces every requirement of the song; a skill left out is removed (PERSONNEL_REQUIREMENT_IN_USE while someone is
 * assigned to it). Only ids and counts are sent.
 */
export async function savePersonnelRequirements(songListItemId: string, requirements: PersonnelRequirement[]): Promise<void> {
  await apiRequest<unknown>(`/api/song-list-items/${songListItemId}/personnel-requirements`, {
    method: 'PUT',
    body: JSON.stringify({ requirements: toRows(requirements) }),
  })
}

/** Whole-service roles of the event (organ, conductor…); Parish Priest and Choir Director read. */
export async function getEventRequirements(eventId: string): Promise<PersonnelRequirement[]> {
  const dtos = await apiRequest<PersonnelRequirementDto[]>(`/api/liturgical-events/${eventId}/personnel-requirements`)
  return dtos.map(({ skillId, skillName, requiredCount }) => ({ skillId, skillName, requiredCount }))
}

/** The lead choir's director replaces them; refused once the roster or its whole-service lines are finalized. */
export async function saveEventRequirements(eventId: string, requirements: PersonnelRequirement[]): Promise<void> {
  await apiRequest<unknown>(`/api/liturgical-events/${eventId}/personnel-requirements`, {
    method: 'PUT',
    body: JSON.stringify({ requirements: toRows(requirements) }),
  })
}

/** `null` while the event has no roster yet (404 ROSTER_NOT_FOUND). */
export async function getRoster(eventId: string): Promise<ServiceRoster | null> {
  try {
    const dto = await apiRequest<ServiceRosterDto>(`/api/service-rosters${toQuery({ eventId })}`)
    return toRoster(dto.id, dto.status, dto.assignments, dto.wholeServiceFinalizedAt)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ROSTER_NOT_FOUND') return null
    throw error
  }
}

/**
 * Positions not fully staffed, also before the event has a roster (FE-37). None while there is neither an approved
 * song list nor a whole-service role (ROSTER_SONG_LIST_NOT_APPROVED).
 */
export async function getShortages(eventId: string): Promise<RosterShortage[]> {
  try {
    return await apiRequest<RosterShortage[]>(`/api/service-rosters/shortages${toQuery({ eventId })}`)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ROSTER_SONG_LIST_NOT_APPROVED') return []
    throw error
  }
}

/**
 * Fills the open positions (FE-36): earlier suggested lines are replaced, manual lines are kept. `isAiGenerated` is
 * false when the backend's rule-based fallback produced the whole suggestion.
 */
export async function suggestRoster(eventId: string): Promise<{ roster: ServiceRoster; isAiGenerated: boolean }> {
  const dto = await apiRequest<RosterSuggestionDto>('/api/service-rosters/suggestions', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  })
  return { roster: toRoster(dto.rosterId, dto.status, dto.assignments), isAiGenerated: dto.isAiGenerated }
}

export interface NewAssignment {
  eventId: string
  /** Absent for a whole-service line. */
  songListItemId?: string
  skillId: string
  memberId: string
}

export async function addAssignment(values: NewAssignment): Promise<void> {
  await apiRequest<unknown>('/api/service-rosters/assignments', { method: 'POST', body: JSON.stringify(values) })
}

/** The replaced line is kept as history on the backend (FE-38). */
export async function replaceAssignment(assignmentId: string, memberId: string): Promise<void> {
  await apiRequest<unknown>(`/api/service-rosters/assignments/${assignmentId}/replacement`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  })
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  await apiRequest<unknown>(`/api/service-rosters/assignments/${assignmentId}`, { method: 'DELETE' })
}

/** Sets the role note of a line; an empty note clears it. */
export async function updateAssignmentNote(assignmentId: string, note: string): Promise<void> {
  await apiRequest<unknown>(`/api/service-rosters/assignments/${assignmentId}/note`, {
    method: 'PUT',
    body: JSON.stringify({ note: note.trim() || null }),
  })
}

/**
 * Locks only the whole-service lines (BE d1ca63e), so the organist and conductor can be told before the song list is
 * ready; they can still be replaced afterwards.
 */
export async function finalizeWholeService(rosterId: string): Promise<void> {
  await apiRequest<unknown>(`/api/service-rosters/${rosterId}/whole-service-finalization`, { method: 'POST' })
}

/** Locks the roster (FE-39); shortages do not block it. */
export async function finalizeRoster(rosterId: string): Promise<void> {
  await apiRequest<unknown>(`/api/service-rosters/${rosterId}/finalization`, { method: 'POST' })
}

/**
 * Notifies the chosen members of their lines (FE-40); refused before the roster or its whole-service lines are
 * finalized. Before the full finalization, only whole-service lines are announced.
 */
export async function sendRosterNotifications(rosterId: string, memberIds: string[]): Promise<void> {
  await apiRequest<unknown>(`/api/service-rosters/${rosterId}/notifications`, {
    method: 'POST',
    body: JSON.stringify({ memberIds }),
  })
}
