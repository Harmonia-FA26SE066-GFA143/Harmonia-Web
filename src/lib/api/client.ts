import { env } from '@/config/env'
import { clearSession, getSession, setSession, type Session } from '@/lib/auth/session'
import { ApiError } from './errors'

/**
 * Thin fetch wrapper. Feature `api/` modules call this; UI components never call fetch directly.
 * Sends the stored access token and, when the backend reports it expired, refreshes the session once and
 * retries (Harmonia_API_Doc: 401 AUTH_TOKEN_EXPIRED → POST /api/auth/refresh).
 * Pass `init` as a function when the request itself carries session data: it is rebuilt for the retry, after
 * the refresh token has rotated.
 */
export async function apiRequest<T>(path: string, init: RequestInit | (() => RequestInit) = {}): Promise<T> {
  const build = typeof init === 'function' ? init : () => init
  let { response, body } = await send(path, build())

  if (response.status === 401) {
    const code = new ApiError(401, body).code
    if (code === 'AUTH_TOKEN_EXPIRED' && (await refreshSessionOnce())) {
      ;({ response, body } = await send(path, build()))
    } else if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID') {
      // The refresh was rejected, or there is no valid token at all: start over at sign-in. The full reload also
      // drops cached data of the previous session.
      clearSession()
      location.assign('/login')
    }
  }

  if (!response.ok) throw new ApiError(response.status, body)
  return body as T
}

async function send(path: string, init: RequestInit) {
  const accessToken = getSession()?.accessToken
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      // FormData needs the browser to set multipart/form-data with its boundary.
      ...(!(init.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...init.headers,
    },
  })
  return { response, body: await readBody(response) }
}

async function readBody(response: Response) {
  const text = await response.text()
  return text ? safeJson(text) : undefined
}

let refreshing: Promise<boolean> | undefined

/** Requests that expire together share one refresh: the token rotates, so a second call would be rejected. */
function refreshSessionOnce(): Promise<boolean> {
  refreshing ??= refreshSession().finally(() => {
    refreshing = undefined
  })
  return refreshing
}

/**
 * Refresh answers that end the session (Harmonia-BE ErrorStatusMap): 400 VALIDATION_FAILED,
 * 401 AUTH_REFRESH_TOKEN_NOT_FOUND / _REVOKED / _EXPIRED, 403 AUTH_ACCOUNT_INACTIVE.
 */
const sessionEndingStatuses = [400, 401, 403]

/**
 * True when a usable session is stored afterwards. Resolves false only when the backend rejects the refresh
 * token; a server or network failure rejects instead, so the user keeps the session and sees an error.
 */
async function refreshSession(): Promise<boolean> {
  const refreshToken = getSession()?.refreshToken
  if (!refreshToken) return false
  // Plain fetch: going through apiRequest could recurse into another refresh.
  const response = await fetch(`${env.apiBaseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (response.ok) {
    setSession((await response.json()) as Session)
    return true
  }
  if (!sessionEndingStatuses.includes(response.status)) throw new ApiError(response.status, await readBody(response))
  // Another tab may have refreshed first: rotation revoked the token sent here, but its new session is stored.
  // ponytail: if this answer arrives before the other tab stores its session, the user is still signed out;
  // serializing refreshes across tabs with navigator.locks would close that window.
  const current = getSession()?.refreshToken
  return current !== undefined && current !== refreshToken
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
