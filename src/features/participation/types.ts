/**
 * A member's response to a participation confirmation request, using the FE-06 terms (Confirm attendance,
 * Decline attendance, Unsure). One confirmation round per liturgical program; the Director picks the recipients
 * (owner decision 2026-09-29, rehearsal-attendance.md DECIDED).
 * TBD: Backend API missing – persisted values come with the contract.
 */
export type ParticipationResponse = 'confirmed' | 'declined' | 'unsure'

export const participationResponseLabels: Record<ParticipationResponse, string> = {
  confirmed: 'Xác nhận',
  declined: 'Từ chối',
  unsure: 'Chưa chắc chắn',
}

/** One member who was sent the request; `response` is absent until the member responds. */
export interface ParticipationRequest {
  memberId: string
  fullName: string
  skills: string[]
  /** ISO date-time of the latest send. TBD: chờ API contract (not named by any source). */
  sentAt?: string
  response?: ParticipationResponse
  /** ISO date-time. TBD: chờ API contract. */
  respondedAt?: string
}
