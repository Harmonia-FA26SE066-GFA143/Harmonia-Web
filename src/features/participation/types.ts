/**
 * A member's answer to a participation request (`ParticipationStatus` of Harmonia-BE, FE-06): Confirmed, Declined or
 * Unsure; a request still `Invited` has no response.
 */
export type ParticipationResponse = 'confirmed' | 'declined' | 'unsure'

export const participationResponseLabels: Record<ParticipationResponse, string> = {
  confirmed: 'Xác nhận',
  declined: 'Từ chối',
  unsure: 'Chưa chắc chắn',
}

/** One member asked to serve at the event (`EventParticipationDto`). */
export interface ParticipationRequest {
  id: string
  memberId: string
  fullName: string
  /** Backend `DateTime`s; read them with `parseUtc`. */
  requestedAt: string
  /** Absent until the member answers. */
  response?: ParticipationResponse
  respondedAt?: string
  /** The member's note with the answer. */
  note?: string
}
