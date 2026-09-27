/**
 * Thrown by a feature API function whose backend endpoint has no contract yet (TBD: Backend API missing).
 * Decision 0002: no endpoint is guessed; the UI shows its error state until the contract exists.
 */
export class ApiContractMissingError extends Error {
  readonly capability: string

  constructor(capability: string) {
    super(`TBD: Backend API missing – ${capability}`)
    this.name = 'ApiContractMissingError'
    this.capability = capability
  }
}

/** Error thrown for non-2xx API responses. The backend error body format is TBD (no API contract yet). */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}
