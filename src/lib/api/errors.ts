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

/**
 * Error thrown for non-2xx API responses. Body format (Harmonia-BE `ErrorResponse`):
 * `{ code, message }`, plus `errors: { <field>: [<CODE>] }` for 400 VALIDATION_FAILED. A 403 from the
 * authorization layer and a routing 404 can have no body.
 * The UI shows feedback by `code` and never displays the backend `message`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  readonly code?: string
  readonly errors?: Record<string, string[]>

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    if (body && typeof body === 'object') {
      const { code, errors } = body as { code?: unknown; errors?: Record<string, string[]> }
      if (typeof code === 'string') this.code = code
      this.errors = errors
    }
  }
}
