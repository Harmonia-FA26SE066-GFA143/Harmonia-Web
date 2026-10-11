import type { SongFilters } from './types'

export const emptySongFilters: SongFilters = { search: '' }

const selectKeys = ['seasonId', 'massTypeId', 'ceremonyTypeId', 'themeId', 'skillId'] as const

/** The list's filters and page live in the query string, so Back from a song shows the list as it was left. */
export function readSongListState(params: URLSearchParams): { filters: SongFilters; page: number } {
  const filters: SongFilters = { search: params.get('search') ?? '' }
  for (const key of selectKeys) filters[key] = params.get(key) ?? undefined
  return { filters, page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1) }
}

export function writeSongListState(filters: SongFilters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  for (const key of selectKeys) {
    const value = filters[key]
    if (value) params.set(key, value)
  }
  if (page > 1) params.set('page', String(page))
  return params
}

export function hasActiveSongFilters(filters: SongFilters): boolean {
  return Object.entries(filters).some(([key, value]) => (key === 'search' ? Boolean(String(value).trim()) : Boolean(value)))
}
