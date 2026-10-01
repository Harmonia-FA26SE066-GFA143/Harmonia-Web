/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `practiceApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * dev-program-5 (approved song list, confirmation round) has two assignments; the audience is resolved from the
 * participation fixture's confirmed members. Statuses here are sample data; the real backend sets them (FE-12).
 * No audio files exist, so `audioUrl` is empty.
 */
import dayjs from 'dayjs'
import { participationSnapshot } from '@/features/participation/api/fixtures.dev'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { PracticeAssignment, PracticeAssignmentValues, PracticeStatus, PracticeSubmission, ReviewResult } from '../types'

let assignments: PracticeAssignment[] = [
  {
    id: 'dev-practice-1',
    programId: 'dev-program-5',
    title: 'Luyện bè trầm nhịp điệp khúc',
    instructions: 'Ngân đủ 3 phách, lấy hơi trước câu 2.',
    song: { songId: 'dev-song-8', title: 'Xin Vâng' },
    dueAt: dayjs().add(3, 'day').hour(23).minute(59).second(0).toISOString(),
    audience: { kind: 'skills', skills: ['Bass', 'Tenor'] },
  },
  {
    id: 'dev-practice-2',
    programId: 'dev-program-5',
    title: 'Ráp 4 bè đoạn kết',
    song: { songId: 'dev-song-3', title: 'Linh Hồn Tôi Tán Tụng Chúa' },
    dueAt: dayjs().subtract(1, 'day').hour(22).minute(0).second(0).toISOString(),
    audience: { kind: 'all' },
  },
]

const reviewedAt = (days: number) => dayjs().subtract(days, 'day').toISOString()
const sample: Record<string, Partial<PracticeSubmission>> = {
  'dev-practice-1:dev-member-3': { status: 'submitted', submittedAt: reviewedAt(1), durationSeconds: 165, reviews: [] },
  'dev-practice-1:dev-member-4': {
    status: 'needsRevision',
    submittedAt: reviewedAt(2),
    durationSeconds: 150,
    reviews: [
      { submittedAt: reviewedAt(2), result: 'needsRevision', feedback: 'Hơi non nốt Rê ở ô nhịp 14. Vui lòng thu lại đoạn này.', reviewedAt: reviewedAt(1) },
    ],
  },
  'dev-practice-2:dev-member-1': {
    status: 'passed',
    submittedAt: reviewedAt(3),
    durationSeconds: 190,
    reviews: [{ submittedAt: reviewedAt(3), result: 'passed', feedback: 'Giọng truyền cảm, nhịp chính xác.', reviewedAt: reviewedAt(2) }],
  },
  'dev-practice-2:dev-member-2': {
    status: 'overdue',
    submittedAt: reviewedAt(4),
    durationSeconds: 120,
    reviews: [{ submittedAt: reviewedAt(4), result: 'needsRevision', feedback: 'Cần giữ nhịp đều hơn ở đoạn cao trào.', reviewedAt: reviewedAt(3) }],
  },
}
const submitted = new Map<string, Partial<PracticeSubmission>>(Object.entries(sample))

function audience(assignment: PracticeAssignment) {
  const confirmed = participationSnapshot(assignment.programId).filter((request) => request.response === 'confirmed')
  const { audience: target } = assignment
  if (target.kind === 'all') return confirmed
  if (target.kind === 'skills') return confirmed.filter((member) => member.skills.some((skill) => target.skills.includes(skill)))
  return confirmed.filter((member) => target.members.some((item) => item.memberId === member.memberId))
}

function submissions(programId: string): PracticeSubmission[] {
  return assignments
    .filter((assignment) => assignment.programId === programId)
    .flatMap((assignment) =>
      audience(assignment).map((member) => {
        const id = `${assignment.id}:${member.memberId}`
        const data = submitted.get(id)
        const overdue = !data?.submittedAt && Date.parse(assignment.dueAt) < Date.now()
        return {
          id,
          assignmentId: assignment.id,
          memberId: member.memberId,
          fullName: member.fullName,
          skills: member.skills,
          status: overdue ? 'overdue' : undefined,
          ...data,
          reviews: data?.reviews ?? [],
        }
      }),
    )
}

export const listAssignmentsFixture = (programId: string) =>
  readFixture(assignments.filter((assignment) => assignment.programId === programId))

export const createAssignmentFixture = (programId: string, values: PracticeAssignmentValues) =>
  writeFixture(() => {
    const assignment: PracticeAssignment = { id: nextFixtureId('practice'), programId, ...values }
    assignments = [...assignments, assignment]
    return assignment
  })

export const listSubmissionsFixture = (programId: string) => readFixture(submissions(programId))

export const reviewSubmissionFixture = (submissionId: string, review: { result: ReviewResult; feedback?: string }) =>
  writeFixture(() => {
    const programId = assignments.find((assignment) => submissionId.startsWith(`${assignment.id}:`))?.programId ?? ''
    const current = submissions(programId).find((item) => item.id === submissionId)
    if (!current?.submittedAt) throw new Error('DEV FIXTURE: chưa có bài nộp để đánh giá')
    const submittedAt = current.submittedAt
    // Editing the review of the same submission replaces it in place; earlier reviews stay as history.
    const earlier = current.reviews.filter((item, index) => !(index === 0 && item.submittedAt === submittedAt))
    const history = [{ ...review, submittedAt, reviewedAt: new Date().toISOString() }, ...earlier]
    // Sample of the decided rule: after the deadline anything but "Passed" is Overdue (decision 2026-10-01).
    const assignment = assignments.find((item) => item.id === current.assignmentId)
    const pastDeadline = assignment !== undefined && Date.parse(assignment.dueAt) < Date.now()
    const status: PracticeStatus = review.result === 'passed' || !pastDeadline ? review.result : 'overdue'
    submitted.set(submissionId, { ...submitted.get(submissionId), status, reviews: history })
    return { ...current, status, reviews: history }
  })
