import { env } from '@/config/env'
import { ApiError } from './errors'

/**
 * Thin fetch wrapper. Feature `api/` modules call this; UI components never call fetch directly.
 * Authentication headers are TBD until the backend auth contract is available.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })

  const text = await response.text()
  const body: unknown = text ? safeJson(text) : undefined

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with status ${response.status}`, body)
  }
  return body as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
