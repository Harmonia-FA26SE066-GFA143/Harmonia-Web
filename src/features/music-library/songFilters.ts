import { materialKinds, type MaterialKind, type SongFilters } from './types'

export const emptySongFilters: SongFilters = { search: '' }

/** Router state of a song opened from the list: the list's query string, for "Về kho bài hát". */
export interface SongListState {
  listSearch: string
}

export const songListState = (listSearch: string): SongListState => ({ listSearch })

export const listSearchOf = (state: unknown): string =>
  typeof state === 'object' && state !== null && 'listSearch' in state && typeof state.listSearch === 'string' ? state.listSearch : ''

const selectKeys = ['seasonId', 'massTypeId', 'ceremonyTypeId', 'themeId', 'slotId', 'skillId'] as const

/** The list's filters and page live in the query string, so Back from a song shows the list as it was left. */
export function readSongListState(params: URLSearchParams): { filters: SongFilters; page: number } {
  const filters: SongFilters = { search: params.get('search') ?? '' }
  for (const key of selectKeys) filters[key] = params.get(key) ?? undefined
  const classified = params.get('classified')
  if (classified === 'yes' || classified === 'no') filters.classified = classified
  const missing = params.get('missingMaterial')
  if (materialKinds.includes(missing as MaterialKind)) filters.missingMaterial = missing as MaterialKind
  return { filters, page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1) }
}

export function writeSongListState(filters: SongFilters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  for (const key of selectKeys) {
    const value = filters[key]
    if (value) params.set(key, value)
  }
  if (filters.classified) params.set('classified', filters.classified)
  if (filters.missingMaterial) params.set('missingMaterial', filters.missingMaterial)
  if (page > 1) params.set('page', String(page))
  return params
}

export function hasActiveSongFilters(filters: SongFilters): boolean {
  return Object.entries(filters).some(([key, value]) => (key === 'search' ? Boolean(String(value).trim()) : Boolean(value)))
}
