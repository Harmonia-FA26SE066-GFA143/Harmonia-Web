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

/**
 * Every item of a paged list, read 100 at a time (the backend maximum), for summaries the backend does not compute.
 * ponytail: sequential pages; fine for a choir's yearly volume, needs a backend aggregate if it grows to thousands.
 */
export async function fetchAllPages<T>(load: (page: { pageNumber: number; pageSize: number }) => Promise<PagedList<T>>): Promise<T[]> {
  const items: T[] = []
  for (let pageNumber = 1; ; pageNumber += 1) {
    const page = await load({ pageNumber, pageSize: 100 })
    items.push(...page.items)
    if (pageNumber >= page.totalPages) return items
  }
}
