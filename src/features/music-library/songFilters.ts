import { matchesSearch } from '@/shared/utils/search'
import type { Song, SongFilters } from './types'

export const emptySongFilters: SongFilters = { search: '' }

export function hasActiveSongFilters(filters: SongFilters): boolean {
  return Object.entries(filters).some(([key, value]) => (key === 'search' ? Boolean(String(value).trim()) : Boolean(value)))
}

/** Client-side filtering until server-side filters are defined (TBD). */
export function filterSongs(songs: Song[], filters: SongFilters): Song[] {
  return songs.filter(
    (song) =>
      matchesSearch(filters.search, song.title) &&
      (!filters.seasonId || song.season?.id === filters.seasonId) &&
      (!filters.massTypeId || song.massType?.id === filters.massTypeId) &&
      (!filters.ceremonyTypeId || song.ceremonyType?.id === filters.ceremonyTypeId) &&
      (!filters.theme || song.theme === filters.theme) &&
      (!filters.vocalRequirements || song.vocalRequirements === filters.vocalRequirements) &&
      (!filters.instrumentRequirements || song.instrumentRequirements === filters.instrumentRequirements),
  )
}

/**
 * Distinct values used in the library for a free-text dimension. Their vocabularies are UNRESOLVED (FE-29),
 * so filter and form suggestions come from what is already recorded.
 */
export function distinctValues(songs: Song[], key: 'theme' | 'vocalRequirements' | 'instrumentRequirements'): string[] {
  return [...new Set(songs.map((song) => song[key]).filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b, 'vi'),
  )
}
