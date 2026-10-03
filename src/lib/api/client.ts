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

  if (response.status === 401 && new ApiError(401, body).code === 'AUTH_TOKEN_EXPIRED') {
    if (await refreshSessionOnce()) {
      ;({ response, body } = await send(path, build()))
    } else {
      // The refresh token was rejected: start over at sign-in. The full reload also drops cached data of
      // the previous session.
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
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...init.headers,
    },
  })
  const text = await response.text()
  return { response, body: text ? safeJson(text) : undefined }
}

let refreshing: Promise<boolean> | undefined

/** Requests that expire together share one refresh: the token rotates, so a second call would be rejected. */
function refreshSessionOnce(): Promise<boolean> {
  refreshing ??= refreshSession().finally(() => {
    refreshing = undefined
  })
  return refreshing
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getSession()?.refreshToken
  if (!refreshToken) return false
  // Plain fetch: going through apiRequest could recurse into another refresh.
  const response = await fetch(`${env.apiBaseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) return false
  setSession((await response.json()) as Session)
  return true
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
