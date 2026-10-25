/** Envelope of every paged list (Harmonia-BE `PagedList<T>`, `pageSize` clamped to 1–100, default 20). */
export interface PagedList<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** Query string from the defined, non-empty values: `{ pageNumber: 2, keyword: '' }` → `?pageNumber=2`. */
export function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
