import type { SongFilters } from './types'

export const emptySongFilters: SongFilters = { search: '' }

export function hasActiveSongFilters(filters: SongFilters): boolean {
  return Object.entries(filters).some(([key, value]) => (key === 'search' ? Boolean(String(value).trim()) : Boolean(value)))
}
