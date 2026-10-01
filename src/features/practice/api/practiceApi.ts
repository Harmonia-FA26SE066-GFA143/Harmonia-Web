import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { PracticeAssignment, PracticeAssignmentValues, PracticeSubmission, ReviewResult } from '../types'

// TBD: Backend API missing – practice assignments, submissions and reviews (FE-12, FE-41–FE-46). Decision 0002: no
// endpoint is guessed. Each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped
// from dist/.

export async function listAssignments(programId: string): Promise<PracticeAssignment[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listAssignmentsFixture } = await import('./fixtures.dev')
    return listAssignmentsFixture(programId)
  }
  throw new ApiContractMissingError('Xem bài tập luyện tập')
}

export async function createAssignment(programId: string, values: PracticeAssignmentValues): Promise<PracticeAssignment> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { createAssignmentFixture } = await import('./fixtures.dev')
    return createAssignmentFixture(programId, values)
  }
  throw new ApiContractMissingError('Giao bài tập luyện tập')
}

/** Every audience member of every assignment of the program, with their latest submission and reviews. */
export async function listSubmissions(programId: string): Promise<PracticeSubmission[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listSubmissionsFixture } = await import('./fixtures.dev')
    return listSubmissionsFixture(programId)
  }
  throw new ApiContractMissingError('Xem bài nộp luyện tập')
}

/** Records a manual review; a later review replaces the current result and keeps the earlier one as history. */
export async function reviewSubmission(
  submissionId: string,
  review: { result: ReviewResult; feedback?: string },
): Promise<PracticeSubmission> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { reviewSubmissionFixture } = await import('./fixtures.dev')
    return reviewSubmissionFixture(submissionId, review)
  }
  throw new ApiContractMissingError('Đánh giá bài nộp luyện tập')
}
