/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `rosterApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Stands in for Harmonia-BE `RosterService` / `SongPersonnelRequirementService` while song lists and participation
 * have no controller (B14, B15): same DTO shapes and error codes, simplified checks. The suggestion below only
 * fills open positions with confirmed members holding the skill; it is NOT the backend's matching (FE-36).
 * dev-program-5 (approved song list, confirmation round) has requirements and two manual lines; song list item ids
 * come from the song-lists fixture, skills are samples.
 */
import { participationSnapshot } from '@/features/participation/api/fixtures.dev'
import { songListOfItem, songListSnapshot } from '@/features/song-lists/api/fixtures.dev'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import { ApiError } from '@/lib/api/errors'
import type { PersonnelRequirement, RosterShortage } from '../types'
import type { NewAssignment, PersonnelRequirementDto, RosterAssignmentDto, RosterSuggestionDto, ServiceRosterDto } from './rosterApi'

interface RosterRecord {
  id: string
  eventId: string
  status: ServiceRosterDto['status']
  assignments: RosterAssignmentDto[]
}

const fail = (status: number, code: string): never => {
  throw new ApiError(status, { code, message: 'DEV FIXTURE' })
}

const requirements = new Map<string, PersonnelRequirement[]>()
const rosters = new Map<string, RosterRecord>()

/** The program a song list item belongs to. */
const programOfItem = (songListItemId: string) =>
  songListOfItem(songListItemId)?.programId ?? fail(404, 'SONG_LIST_ITEM_NOT_FOUND')

function approvedItems(eventId: string) {
  const list = songListSnapshot(eventId)
  return list.status === 'approved' ? list.items : fail(409, 'ROSTER_SONG_LIST_NOT_APPROVED')
}

const confirmed = (eventId: string) => participationSnapshot(eventId).filter((request) => request.response === 'confirmed')

// Seeded lazily: song list item ids are generated when the song-lists fixture loads.
let seeded = false
function seed() {
  if (seeded) return
  seeded = true
  const items = songListSnapshot('dev-program-5').items
  const itemOf = (songId: string) => items.find((item) => item.songId === songId)?.id ?? ''
  requirements.set(itemOf('dev-song-1'), [
    { skillId: 'dev-skill-1', skillName: 'Soprano', requiredCount: 2 },
    { skillId: 'dev-skill-3', skillName: 'Tenor', requiredCount: 2 },
  ])
  requirements.set(itemOf('dev-song-8'), [{ skillId: 'dev-skill-8', skillName: 'Psalmist', requiredCount: 1 }])
  requirements.set(itemOf('dev-song-3'), [{ skillId: 'dev-skill-4', skillName: 'Bass', requiredCount: 2 }])
  const line = (songId: string, skillId: string, skillName: string, memberId: string, memberName: string): RosterAssignmentDto => ({
    id: nextFixtureId('assignment'),
    memberId,
    memberName,
    skillId,
    skillName,
    songListItemId: itemOf(songId),
    songTitle: items.find((item) => item.songId === songId)?.title ?? null,
    source: 'Manual',
  })
  rosters.set('dev-program-5', {
    id: 'dev-roster-5',
    eventId: 'dev-program-5',
    status: 'Draft',
    assignments: [
      line('dev-song-1', 'dev-skill-1', 'Soprano', 'dev-member-2', 'Têrêsa Lê Hoàng Vy'),
      line('dev-song-1', 'dev-skill-3', 'Tenor', 'dev-member-3', 'Giuse Maria Vũ Đình Khôi'),
    ],
  })
}

function shortagesOf(eventId: string): RosterShortage[] {
  const assignments = rosters.get(eventId)?.assignments ?? []
  return approvedItems(eventId).flatMap((item) =>
    (requirements.get(item.id) ?? [])
      .map((requirement) => ({
        songListItemId: item.id,
        songTitle: item.title,
        skillId: requirement.skillId,
        skillName: requirement.skillName,
        requiredCount: requirement.requiredCount,
        assignedCount: assignments.filter((line) => line.songListItemId === item.id && line.skillId === requirement.skillId)
          .length,
      }))
      .filter((shortage) => shortage.assignedCount < shortage.requiredCount),
  )
}

function editableRoster(rosterId: string) {
  const roster = [...rosters.values()].find((entry) => entry.id === rosterId) ?? fail(404, 'ROSTER_NOT_FOUND')
  return roster.status === 'Finalized' ? fail(409, 'ROSTER_ALREADY_FINALIZED') : roster
}

/** The backend's member checks, simplified: confirmed for the event, holding the skill, not already on the line. */
function assignable(eventId: string, line: Pick<RosterAssignmentDto, 'songListItemId' | 'skillId' | 'skillName' | 'memberId'>) {
  const lines = rosters.get(eventId)?.assignments ?? []
  if (lines.some((entry) => entry.songListItemId === line.songListItemId && entry.skillId === line.skillId && entry.memberId === line.memberId)) {
    fail(409, 'ASSIGNMENT_DUPLICATE')
  }
  const member = confirmed(eventId).find((request) => request.memberId === line.memberId) ?? fail(409, 'ASSIGNMENT_MEMBER_NOT_CONFIRMED')
  return member.skills.includes(line.skillName) ? member : fail(409, 'ASSIGNMENT_MEMBER_SKILL_NOT_APPROVED')
}

export async function getRequirementsFixture(songListItemId: string): Promise<PersonnelRequirementDto[]> {
  seed()
  programOfItem(songListItemId)
  return readFixture((requirements.get(songListItemId) ?? []).map((row) => ({ ...row, skillCategoryId: 'dev-category' })))
}

export const saveRequirementsFixture = (songListItemId: string, rows: PersonnelRequirement[]) =>
  writeFixture(() => {
    seed()
    const programId = programOfItem(songListItemId)
    if (rosters.get(programId)?.status === 'Finalized') fail(409, 'ROSTER_ALREADY_FINALIZED')
    requirements.set(songListItemId, rows)
    return {}
  }).then(() => undefined)

export async function getRosterFixture(eventId: string): Promise<ServiceRosterDto> {
  seed()
  const roster = rosters.get(eventId) ?? fail(404, 'ROSTER_NOT_FOUND')
  const [copy] = await readFixture([{ ...roster, assignments: [...roster.assignments], shortages: shortagesOf(eventId) }])
  return copy ?? fail(404, 'ROSTER_NOT_FOUND')
}

export async function getShortagesFixture(eventId: string): Promise<RosterShortage[]> {
  seed()
  return readFixture(shortagesOf(eventId))
}

export const suggestRosterFixture = (eventId: string) =>
  writeFixture((): RosterSuggestionDto => {
    seed()
    const items = approvedItems(eventId)
    if (!items.some((item) => requirements.get(item.id)?.length)) fail(409, 'ROSTER_NO_PERSONNEL_REQUIREMENT')
    const roster: RosterRecord = rosters.get(eventId) ?? { id: nextFixtureId('roster'), eventId, status: 'Draft', assignments: [] }
    if (roster.status === 'Finalized') fail(409, 'ROSTER_ALREADY_FINALIZED')
    // Earlier suggested lines are replaced; manual lines stay.
    roster.assignments = roster.assignments.filter((line) => line.source === 'Manual')
    for (const item of items) {
      for (const requirement of requirements.get(item.id) ?? []) {
        const onLine = roster.assignments.filter((line) => line.songListItemId === item.id && line.skillId === requirement.skillId)
        const candidates = confirmed(eventId).filter(
          (member) => member.skills.includes(requirement.skillName) && !onLine.some((line) => line.memberId === member.memberId),
        )
        for (const member of candidates.slice(0, Math.max(0, requirement.requiredCount - onLine.length))) {
          roster.assignments.push({
            id: nextFixtureId('assignment'),
            memberId: member.memberId,
            memberName: member.fullName,
            skillId: requirement.skillId,
            skillName: requirement.skillName,
            songListItemId: item.id,
            songTitle: item.title,
            source: 'Suggested',
          })
        }
      }
    }
    roster.status = 'Suggested'
    rosters.set(eventId, roster)
    return { rosterId: roster.id, eventId, status: roster.status, isAiGenerated: false, assignments: [...roster.assignments], shortages: shortagesOf(eventId) }
  })

export const addAssignmentFixture = (values: NewAssignment) =>
  writeFixture(() => {
    seed()
    const items = approvedItems(values.eventId)
    const item = items.find((entry) => entry.id === values.songListItemId)
    const requirement =
      (item && requirements.get(item.id)?.find((row) => row.skillId === values.skillId)) ?? fail(404, 'PERSONNEL_REQUIREMENT_NOT_FOUND')
    const roster = rosters.get(values.eventId) ?? { id: nextFixtureId('roster'), eventId: values.eventId, status: 'Draft' as const, assignments: [] }
    if (roster.status === 'Finalized') fail(409, 'ROSTER_ALREADY_FINALIZED')
    rosters.set(values.eventId, roster)
    const member = assignable(values.eventId, { ...values, skillName: requirement.skillName })
    roster.assignments.push({
      id: nextFixtureId('assignment'),
      memberId: member.memberId,
      memberName: member.fullName,
      skillId: requirement.skillId,
      skillName: requirement.skillName,
      songListItemId: values.songListItemId,
      songTitle: item?.title ?? null,
      source: 'Manual',
    })
    return {}
  }).then(() => undefined)

function findLine(assignmentId: string) {
  for (const roster of rosters.values()) {
    const line = roster.assignments.find((entry) => entry.id === assignmentId)
    if (line) return { roster: editableRoster(roster.id), line }
  }
  return fail(404, 'ASSIGNMENT_NOT_FOUND')
}

export const replaceAssignmentFixture = (assignmentId: string, memberId: string) =>
  writeFixture(() => {
    const { roster, line } = findLine(assignmentId)
    const member = assignable(roster.eventId, { ...line, memberId })
    // The backend keeps the old line as Replaced history; it is no longer listed.
    roster.assignments = roster.assignments.map((entry) =>
      entry.id === assignmentId
        ? { ...line, id: nextFixtureId('assignment'), memberId, memberName: member.fullName, source: 'Manual' as const }
        : entry,
    )
    return {}
  }).then(() => undefined)

export const removeAssignmentFixture = (assignmentId: string) =>
  writeFixture(() => {
    const { roster } = findLine(assignmentId)
    roster.assignments = roster.assignments.filter((entry) => entry.id !== assignmentId)
    return {}
  }).then(() => undefined)

export const finalizeRosterFixture = (rosterId: string) =>
  writeFixture(() => {
    editableRoster(rosterId).status = 'Finalized'
    return {}
  }).then(() => undefined)

export const sendNotificationsFixture = (rosterId: string, memberIds: string[]) =>
  writeFixture(() => {
    const roster = [...rosters.values()].find((entry) => entry.id === rosterId) ?? fail(404, 'ROSTER_NOT_FOUND')
    if (roster.status !== 'Finalized') fail(409, 'ROSTER_NOT_FINALIZED')
    if (memberIds.some((id) => !roster.assignments.some((line) => line.memberId === id))) fail(404, 'ASSIGNMENT_NOT_FOUND')
    return {}
  }).then(() => undefined)
