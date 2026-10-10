/**
 * Practice as Harmonia-BE models it (`PracticeAssignmentsController`, `PracticeSubmissionsController`; owner choice
 * 2026-10-10: follow the BE). `SubmissionStatus` of Harmonia-BE; Overdue is set by the backend.
 */
export type PracticeStatus = 'submitted' | 'passed' | 'needsRevision' | 'overdue'

export const practiceStatuses: PracticeStatus[] = ['submitted', 'needsRevision', 'passed', 'overdue']

export const practiceStatusLabels: Record<PracticeStatus, string> = {
  submitted: 'Chờ chấm',
  passed: 'Đạt',
  needsRevision: 'Cần chỉnh sửa',
  overdue: 'Quá hạn',
}

/** Manual review result (FE-43, LI-03, LI-05): never automatic. */
export type ReviewResult = 'passed' | 'needsRevision'

/** `AssignmentScope` of Harmonia-BE: the whole choir, members with given skills, or chosen members. */
export type AssignmentScope = 'all' | 'skillGroup' | 'individual'

/** Body of POST /api/practice-assignments (CreatePracticeAssignmentRequestValidator). */
export interface AssignmentValues {
  title: string
  instruction?: string
  eventId?: string
  songId?: string
  /** Must belong to the song. */
  materialId?: string
  /** UTC ISO-8601, not in the past. */
  dueDate: string
  scope: AssignmentScope
  /** Required for `skillGroup`. */
  skillIds?: string[]
  /** Member profile ids, required for `individual`. */
  memberIds?: string[]
}

/** One review of a submission (`PracticeFeedbackDto`), oldest first; the last one carries the current result. */
export interface PracticeFeedback {
  id: string
  result: PracticeStatus
  comment: string | null
  reviewerName: string | null
  /** Backend `DateTime`; read it with `parseUtc`. */
  reviewedAt: string
}

/** A member's recorded attempt (`PracticeSubmissionDetailDto`). */
export interface PracticeSubmission {
  id: string
  assignmentId: string
  assignmentTitle: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  assignmentDueDate: string
  memberName: string
  attemptNo: number
  submittedAt: string
  status: PracticeStatus
  durationSeconds: number | null
  /** Short-lived signed URL: fetch the submission again right before playback. */
  audioUrl: string
  feedbacks: PracticeFeedback[]
}
