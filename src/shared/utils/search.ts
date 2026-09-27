/** Lower-cases and strips Vietnamese diacritics so "tenor" matches "Tênô" and "duc" matches "Đức". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** Client-side keyword match across several fields. An empty query matches everything. */
export function matchesSearch(query: string, ...fields: (string | undefined)[]): boolean {
  const needle = normalizeSearchText(query)
  if (!needle) return true
  return fields.some((field) => field !== undefined && normalizeSearchText(field).includes(needle))
}
