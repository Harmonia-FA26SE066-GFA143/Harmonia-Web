/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `rosterApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * dev-program-5 (approved song list, confirmation round) has requirements and a few assignments; skills are samples
 * (the skill select reads the backend lookup), song ids match the song-lists fixture. The "suggestions" below are a naive stand-in so
 * the screen can be reviewed — they are NOT a suggestion rule (FE-36 matching is UNRESOLVED, owned by the backend).
 */
import { participationSnapshot } from '@/features/participation/api/fixtures.dev'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { Roster, RosterRequirement, RosterSuggestion, RosterValues } from '../types'

const skill = (id: string, name: string) => ({ id, name })

const requirements: RosterRequirement[] = [
  { id: 'dev-req-1', skill: skill('dev-skill-6', 'Organ'), count: 1 },
  { id: 'dev-req-2', songId: 'dev-song-1', skill: skill('dev-skill-1', 'Soprano'), count: 2 },
  { id: 'dev-req-3', songId: 'dev-song-1', skill: skill('dev-skill-3', 'Tenor'), count: 2 },
  { id: 'dev-req-4', songId: 'dev-song-8', skill: skill('dev-skill-8', 'Psalmist'), count: 1 },
  { id: 'dev-req-5', songId: 'dev-song-3', skill: skill('dev-skill-2', 'Alto'), count: 1 },
  { id: 'dev-req-6', songId: 'dev-song-3', skill: skill('dev-skill-4', 'Bass'), count: 2 },
]

const rosters = new Map<string, Roster>([
  [
    'dev-program-5',
    {
      programId: 'dev-program-5',
      requirements,
      assignments: [
        { requirementId: 'dev-req-1', memberId: 'dev-member-1', fullName: 'Maria Nguyễn Thu Hướng' },
        { requirementId: 'dev-req-2', memberId: 'dev-member-2', fullName: 'Têrêsa Lê Hoàng Vy' },
        { requirementId: 'dev-req-3', memberId: 'dev-member-3', fullName: 'Giuse Maria Vũ Đình Khôi' },
        { requirementId: 'dev-req-6', memberId: 'dev-member-4', fullName: 'Gioan B. Phạm Hữu Tài' },
      ],
    },
  ],
])

const snapshot = (programId: string): Roster => rosters.get(programId) ?? { programId, requirements: [], assignments: [] }

export async function getRosterFixture(programId: string): Promise<Roster> {
  const [roster] = await readFixture([snapshot(programId)])
  return roster ?? { programId, requirements: [], assignments: [] }
}

export const saveRosterFixture = (programId: string, values: RosterValues) =>
  writeFixture(() => {
    const roster: Roster = {
      programId,
      // Requirements added on the page carry a temporary id until saved.
      requirements: values.requirements.map((item) => (item.id.startsWith('draft-') ? { ...item, id: nextFixtureId('req') } : item)),
      assignments: values.assignments,
    }
    const ids = new Map(values.requirements.map((item, index) => [item.id, roster.requirements[index].id]))
    roster.assignments = values.assignments.map((item) => ({ ...item, requirementId: ids.get(item.requirementId) ?? item.requirementId }))
    rosters.set(programId, roster)
    return roster
  })

export async function getRosterSuggestionsFixture(programId: string): Promise<RosterSuggestion[]> {
  const roster = snapshot(programId)
  const confirmed = participationSnapshot(programId).filter((request) => request.response === 'confirmed')
  const suggestions: RosterSuggestion[] = []
  for (const requirement of roster.requirements) {
    const taken = roster.assignments.filter((item) => item.requirementId === requirement.id)
    const candidates = confirmed.filter(
      (member) => member.skills.includes(requirement.skill.name) && !taken.some((item) => item.memberId === member.memberId),
    )
    for (const member of candidates.slice(0, Math.max(0, requirement.count - taken.length))) {
      suggestions.push({ requirementId: requirement.id, memberId: member.memberId, fullName: member.fullName })
    }
  }
  return readFixture(suggestions)
}

export const sendAssignmentNotificationsFixture = (_programId: string, _memberIds: string[]) =>
  writeFixture(() => ({})).then(() => undefined)
