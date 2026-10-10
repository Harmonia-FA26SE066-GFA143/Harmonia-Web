import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type {
  AssignmentScope,
  AssignmentValues,
  MemberProgress,
  ParticipationStatus,
  PracticeStatus,
  PracticeSubmission,
  ReviewResult,
} from '../types'

// Practice for the Choir Director: `/api/practice-assignments` and `/api/practice-submissions` (Harmonia-BE). There is
// no list of the assignments given (tbd-backlog B21): the page works from the review queue across assignments.

type ApiStatus = 'Submitted' | 'Passed' | 'NeedsRevision' | 'Overdue'

const statusByApi: Record<ApiStatus, PracticeStatus> = {
  Submitted: 'submitted',
  Passed: 'passed',
  NeedsRevision: 'needsRevision',
  Overdue: 'overdue',
}

const apiStatus = Object.fromEntries(Object.entries(statusByApi).map(([api, status]) => [status, api])) as Record<
  PracticeStatus,
  ApiStatus
>

const apiScope: Record<AssignmentScope, string> = { all: 'All', skillGroup: 'SkillGroup', individual: 'Individual' }

interface PracticeFeedbackDto {
  id: string
  result: ApiStatus
  comment: string | null
  reviewerName: string | null
  reviewedAt: string
}

interface PracticeSubmissionDetailDto {
  id: string
  practiceAssignmentId: string
  assignmentTitle: string
  assignmentDueDate: string
  memberName: string
  attemptNo: number
  submittedAt: string
  status: ApiStatus
  durationSeconds: number | null
  audioUrl: string
  feedbacks: PracticeFeedbackDto[]
}

const toSubmission = (dto: PracticeSubmissionDetailDto): PracticeSubmission => ({
  id: dto.id,
  assignmentId: dto.practiceAssignmentId,
  assignmentTitle: dto.assignmentTitle,
  assignmentDueDate: dto.assignmentDueDate,
  memberName: dto.memberName,
  attemptNo: dto.attemptNo,
  submittedAt: dto.submittedAt,
  status: statusByApi[dto.status],
  durationSeconds: dto.durationSeconds,
  audioUrl: dto.audioUrl,
  feedbacks: dto.feedbacks.map((feedback) => ({ ...feedback, result: statusByApi[feedback.result] })),
})

export interface SubmissionPage {
  pageNumber: number
  pageSize: number
}

/** Review queue across every assignment, oldest first; each member's newest attempt only (FE-42). */
export async function listSubmissions(status: PracticeStatus | undefined, page: SubmissionPage): Promise<PagedList<PracticeSubmission>> {
  const result = await apiRequest<PagedList<PracticeSubmissionDetailDto>>(
    `/api/practice-submissions${toQuery({ status: status && apiStatus[status], ...page })}`,
  )
  return { ...result, items: result.items.map(toSubmission) }
}

/** One submission with a fresh signed audio URL and every review so far. */
export async function getSubmission(id: string): Promise<PracticeSubmission> {
  return toSubmission(await apiRequest<PracticeSubmissionDetailDto>(`/api/practice-submissions/${id}`))
}

/** First review of a submission (FE-43): a comment is required for NeedsRevision. */
export async function reviewSubmission(id: string, review: { result: ReviewResult; comment?: string }): Promise<void> {
  await apiRequest<unknown>(`/api/practice-submissions/${id}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ result: apiStatus[review.result], comment: review.comment }),
  })
}

/** A later comment on a reviewed submission (FE-44); `result` changes it, on the member's newest attempt only. */
export async function commentSubmission(id: string, values: { comment: string; result?: ReviewResult }): Promise<void> {
  await apiRequest<unknown>(`/api/practice-submissions/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment: values.comment, result: values.result && apiStatus[values.result] }),
  })
}

/** Gives an assignment (FE-41); the backend notifies its members. */
export async function createAssignment(values: AssignmentValues): Promise<void> {
  await apiRequest<unknown>('/api/practice-assignments', {
    method: 'POST',
    body: JSON.stringify({ ...values, scope: apiScope[values.scope] }),
  })
}

/** An upcoming published event the Choir Director can attach an assignment to (`LiturgicalEventSummaryDto`). */
export interface UpcomingEvent {
  id: string
  eventDate: string
  time: string
  title: string | null
  locationName: string
}

/** The only event list open to the Choir Director (`GET /api/schedule/events`): upcoming published events. */
export function listUpcomingEvents(): Promise<UpcomingEvent[]> {
  return apiRequest<UpcomingEvent[]>('/api/schedule/events')
}

type ApiParticipationStatus = 'Invited' | 'Confirmed' | 'Declined' | 'Unsure'

const participationByApi: Record<ApiParticipationStatus, ParticipationStatus> = {
  Invited: 'invited',
  Confirmed: 'confirmed',
  Declined: 'declined',
  Unsure: 'unsure',
}

interface EventPreparationProgressDto extends Omit<MemberProgress, 'participationStatus'> {
  participationStatus: ApiParticipationStatus | null
}

/** Every active member, by name (`GET /api/liturgical-events/{id}/preparation-progress`, Choir Director only). */
export async function listPreparationProgress(eventId: string): Promise<MemberProgress[]> {
  const rows = await apiRequest<EventPreparationProgressDto[]>(`/api/liturgical-events/${eventId}/preparation-progress`)
  return rows.map(({ participationStatus, ...row }) => ({
    memberId: row.memberId,
    fullName: row.fullName,
    participationStatus: participationStatus ? participationByApi[participationStatus] : undefined,
    rehearsalsHeld: row.rehearsalsHeld,
    rehearsalsAttended: row.rehearsalsAttended,
    assignmentsTotal: row.assignmentsTotal,
    assignmentsPassed: row.assignmentsPassed,
    assignmentsOverdue: row.assignmentsOverdue,
  }))
}
