import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, errorMessage, requestFailureMessage } from './errors'

const offline = 'Không có kết nối mạng. Vui lòng kiểm tra kết nối rồi thử lại.'
const serverDown = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ApiError', () => {
  it('reads code and field errors from the body', () => {
    const error = new ApiError(400, { code: 'VALIDATION_FAILED', errors: { email: ['EMAIL_INVALID'] } })
    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.errors).toEqual({ email: ['EMAIL_INVALID'] })
  })

  it('accepts a missing or malformed body', () => {
    expect(new ApiError(403, undefined).code).toBeUndefined()
    expect(new ApiError(404, 'Not Found').code).toBeUndefined()
    expect(new ApiError(409, { code: 42 }).code).toBeUndefined()
  })
})

describe('requestFailureMessage', () => {
  it('says the network is down on a fetch TypeError or when the browser is offline', () => {
    expect(requestFailureMessage(new TypeError('Failed to fetch'), 'fallback')).toBe(offline)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(requestFailureMessage(new ApiError(400, {}), 'fallback')).toBe(offline)
  })

  it('says the server is down on a 5xx', () => {
    expect(requestFailureMessage(new ApiError(500, {}), 'fallback')).toBe(serverDown)
    expect(requestFailureMessage(new ApiError(503, undefined), 'fallback')).toBe(serverDown)
  })

  it('falls back otherwise', () => {
    expect(requestFailureMessage(new ApiError(409, { code: 'X' }), 'fallback')).toBe('fallback')
    expect(requestFailureMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })
})

describe('errorMessage', () => {
  const messages = { KNOWN: 'known message' }

  it('maps a known code, else falls back through requestFailureMessage', () => {
    expect(errorMessage(new ApiError(409, { code: 'KNOWN' }), messages, 'fallback')).toBe('known message')
    expect(errorMessage(new ApiError(409, { code: 'OTHER' }), messages, 'fallback')).toBe('fallback')
    expect(errorMessage(new ApiError(500, {}), messages, 'fallback')).toBe(serverDown)
    expect(errorMessage(new TypeError('x'), messages, 'fallback')).toBe(offline)
  })
})
