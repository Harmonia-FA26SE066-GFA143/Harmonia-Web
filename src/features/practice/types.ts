/**
 * Practice submission statuses named by Report 1 FE-12 (EXPLICIT). The persisted values come with the contract.
 * "Overdue" = the deadline passed without a "Passed" result (decision 2026-10-01); whether the backend or the client
 * computes it is TBD with the contract.
 */
export type PracticeStatus = 'submitted' | 'passed' | 'needsRevision' | 'overdue'

export const practiceStatusLabels: Record<PracticeStatus, string> = {
  submitted: 'Đã nộp',
  passed: 'Đạt',
  needsRevision: 'Cần chỉnh sửa',
  overdue: 'Quá hạn',
}

/** Manual review result (FE-43, LI-03, LI-05): never automatic. */
export type ReviewResult = 'passed' | 'needsRevision'

/** Who receives the assignment, among the members who confirmed the program (FE-41, decision 2026-10-01). */
export type PracticeAudience =
  | { kind: 'all' }
  | { kind: 'skills'; skills: string[] }
  | { kind: 'members'; members: { memberId: string; fullName: string }[] }

/**
 * A practice assignment of one program and one song of its approved list (decision 2026-10-01).
 * TBD: Backend API missing – identifiers and field names come with the contract.
 */
export interface PracticeAssignment {
  id: string
  programId: string
  title: string
  instructions?: string
  song: { songId: string; title: string }
  /** ISO date-time. */
  dueAt: string
  audience: PracticeAudience
}

export type PracticeAssignmentValues = Omit<PracticeAssignment, 'id' | 'programId'>

export interface PracticeReview {
  /**
   * The submission this review judges (its `submittedAt`), so a resubmission gets a new review instead of editing
   * the earlier one. TBD: chờ API contract – how a review references its submission.
   */
  submittedAt: string
  result: ReviewResult
  feedback?: string
  /** ISO date-time. */
  reviewedAt: string
}

/**
 * One member of an assignment's audience with their latest submission. Without `submittedAt` the member has not
 * submitted yet. Earlier submissions after "Needs Revision" are kept by the backend (decision 2026-10-01).
 */
export interface PracticeSubmission {
  id: string
  assignmentId: string
  memberId: string
  fullName: string
  skills: string[]
  /** Absent until the member submits; then the backend sets it. */
  status?: PracticeStatus
  /** ISO date-time of the latest submission. */
  submittedAt?: string
  /** TBD: how audio files are served comes with the contract. */
  audioUrl?: string
  durationSeconds?: number
  /** Latest review first; earlier reviews are history (FE-44, decision 2026-10-01). */
  reviews: PracticeReview[]
}
