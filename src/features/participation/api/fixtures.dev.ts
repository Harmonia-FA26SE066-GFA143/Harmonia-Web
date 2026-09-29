/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `participationApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Program ids match the liturgical-programs fixtures, member ids the members fixture. dev-program-3 has a round
 * with mixed responses; programs without an entry have no round yet. Members never respond in the fixture.
 */
import dayjs from 'dayjs'
import { choirMembers } from '@/features/members/api/fixtures.dev'
import { readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { ParticipationRequest, ParticipationResponse } from '../types'

const sentAt = dayjs().subtract(2, 'day').hour(9).minute(30).second(0).toISOString()
const respondedAt = (hoursAfterSend: number) => dayjs(sentAt).add(hoursAfterSend, 'hour').toISOString()

const responses: (ParticipationResponse | undefined)[] = [
  'confirmed',
  'confirmed',
  'confirmed',
  'confirmed',
  'declined',
  undefined,
  'confirmed',
  'unsure',
  undefined,
  'confirmed',
  'confirmed',
  undefined,
]

const rounds = new Map<string, ParticipationRequest[]>([
  [
    'dev-program-3',
    choirMembers.map(({ id, fullName, skills }, index) => {
      const response = responses[index]
      return { memberId: id, fullName, skills, sentAt, response, respondedAt: response ? respondedAt(index + 1) : undefined }
    }),
  ],
])

export const getParticipationFixture = (programId: string) => readFixture(rounds.get(programId) ?? [])

export const sendParticipationRequestsFixture = (programId: string, memberIds: string[]) =>
  writeFixture(() => {
    const now = new Date().toISOString()
    const current = rounds.get(programId) ?? []
    const resent = current.map((request) => (memberIds.includes(request.memberId) ? { ...request, sentAt: now } : request))
    const added = choirMembers
      .filter((member) => memberIds.includes(member.id) && !current.some((request) => request.memberId === member.id))
      .map(({ id, fullName, skills }) => ({ memberId: id, fullName, skills, sentAt: now }))
    rounds.set(programId, [...resent, ...added])
    return { requests: rounds.get(programId) ?? [] }
  }).then((result) => result.requests)
