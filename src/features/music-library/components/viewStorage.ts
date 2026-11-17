/** The library's two views (artifact SongLibraryPage): score cards, or the hymnal's contents page. */
export type ViewMode = 'grid' | 'index'

const VIEW_STORAGE_KEY = 'harmonia:music-library:view'

export function getStoredViewMode(): ViewMode {
  try {
    if (localStorage.getItem(VIEW_STORAGE_KEY) === 'index') return 'index'
  } catch {
    // localStorage may be restricted or disabled
  }
  return 'grid'
}

export function setStoredViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  } catch {
    // localStorage may be restricted or disabled
  }
}
