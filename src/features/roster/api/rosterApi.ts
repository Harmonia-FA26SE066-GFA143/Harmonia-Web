import { env } from '@/config/env'
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

// Personnel requirements: `/api/song-list-items/{id}/personnel-requirements` (Harmonia-BE SongListItemsController).
// Roster: `/api/service-rosters` (ServiceRostersController), Choir Director only.
// The backend only accepts an event with an approved song list (ROSTER_SONG_LIST_NOT_APPROVED) and assigns only
// members who confirmed their participation; neither has a controller yet (tbd-backlog B14, B15), so the page runs
// on dev fixtures that answer like the backend until they do. Program ids are event ids.

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
  source: 'Suggested' | 'Manual'
}

export interface ServiceRosterDto {
  id: string
  eventId: string
  status: ApiRosterStatus
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
  source: dto.source === 'Suggested' ? 'suggested' : 'manual',
})

const toRoster = (id: string, status: ApiRosterStatus, assignments: RosterAssignmentDto[]): ServiceRoster => ({
  id,
  status: statusByApi[status],
  assignments: assignments.map(toAssignment),
})

/** The dev fixture standing in for the backend, or undefined outside development with fixtures on. */
async function devBackend() {
  if (import.meta.env.DEV && env.useDevFixtures) return import('./fixtures.dev')
  return undefined
}

export async function getPersonnelRequirements(songListItemId: string): Promise<PersonnelRequirement[]> {
  const dev = await devBackend()
  const dtos = dev
    ? await dev.getRequirementsFixture(songListItemId)
    : await apiRequest<PersonnelRequirementDto[]>(`/api/song-list-items/${songListItemId}/personnel-requirements`)
  return dtos.map(({ skillId, skillName, requiredCount }) => ({ skillId, skillName, requiredCount }))
}

/** Replaces every requirement of the song; a skill left out is removed. The names are for the dev fixture only. */
export async function savePersonnelRequirements(songListItemId: string, requirements: PersonnelRequirement[]): Promise<void> {
  const dev = await devBackend()
  if (dev) return dev.saveRequirementsFixture(songListItemId, requirements)
  const rows: PersonnelRequirementValue[] = requirements.map(({ skillId, requiredCount }) => ({ skillId, requiredCount }))
  await apiRequest<unknown>(`/api/song-list-items/${songListItemId}/personnel-requirements`, {
    method: 'PUT',
    body: JSON.stringify({ requirements: rows }),
  })
}

/** `null` while the event has no roster yet (404 ROSTER_NOT_FOUND). */
export async function getRoster(eventId: string): Promise<ServiceRoster | null> {
  const dev = await devBackend()
  try {
    const dto = dev
      ? await dev.getRosterFixture(eventId)
      : await apiRequest<ServiceRosterDto>(`/api/service-rosters${toQuery({ eventId })}`)
    return toRoster(dto.id, dto.status, dto.assignments)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'ROSTER_NOT_FOUND') return null
    throw error
  }
}

/** Positions not fully staffed, also before the event has a roster (FE-37). */
export async function getShortages(eventId: string): Promise<RosterShortage[]> {
  const dev = await devBackend()
  return dev
    ? dev.getShortagesFixture(eventId)
    : apiRequest<RosterShortage[]>(`/api/service-rosters/shortages${toQuery({ eventId })}`)
}

/**
 * Fills the open positions (FE-36): earlier suggested lines are replaced, manual lines are kept. `isAiGenerated` is
 * false when the backend's rule-based fallback produced the whole suggestion.
 */
export async function suggestRoster(eventId: string): Promise<{ roster: ServiceRoster; isAiGenerated: boolean }> {
  const dev = await devBackend()
  const dto = dev
    ? await dev.suggestRosterFixture(eventId)
    : await apiRequest<RosterSuggestionDto>('/api/service-rosters/suggestions', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      })
  return { roster: toRoster(dto.rosterId, dto.status, dto.assignments), isAiGenerated: dto.isAiGenerated }
}

export interface NewAssignment {
  eventId: string
  songListItemId: string
  skillId: string
  memberId: string
}

export async function addAssignment(values: NewAssignment): Promise<void> {
  const dev = await devBackend()
  if (dev) return dev.addAssignmentFixture(values)
  await apiRequest<unknown>('/api/service-rosters/assignments', { method: 'POST', body: JSON.stringify(values) })
}

/** The replaced line is kept as history on the backend (FE-38). */
export async function replaceAssignment(assignmentId: string, memberId: string): Promise<void> {
  const dev = await devBackend()
  if (dev) return dev.replaceAssignmentFixture(assignmentId, memberId)
  await apiRequest<unknown>(`/api/service-rosters/assignments/${assignmentId}/replacement`, {
    method: 'POST',
    body: JSON.stringify({ memberId }),
  })
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  const dev = await devBackend()
  if (dev) return dev.removeAssignmentFixture(assignmentId)
  await apiRequest<unknown>(`/api/service-rosters/assignments/${assignmentId}`, { method: 'DELETE' })
}

/** Locks the roster (FE-39); shortages do not block it. */
export async function finalizeRoster(rosterId: string): Promise<void> {
  const dev = await devBackend()
  if (dev) return dev.finalizeRosterFixture(rosterId)
  await apiRequest<unknown>(`/api/service-rosters/${rosterId}/finalization`, { method: 'POST' })
}

/** Notifies the chosen members of their lines (FE-40); the backend refuses before the roster is finalized. */
export async function sendRosterNotifications(rosterId: string, memberIds: string[]): Promise<void> {
  const dev = await devBackend()
  if (dev) return dev.sendNotificationsFixture(rosterId, memberIds)
  await apiRequest<unknown>(`/api/service-rosters/${rosterId}/notifications`, {
    method: 'POST',
    body: JSON.stringify({ memberIds }),
  })
}
