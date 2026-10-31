export type ViewMode = 'index' | 'table'
export type DensityMode = 'compact' | 'comfortable'

const VIEW_STORAGE_KEY = 'harmonia:music-library:view'
const DENSITY_STORAGE_KEY = 'harmonia:music-library:density'

export function getStoredViewMode(): ViewMode {
  try {
    const val = localStorage.getItem(VIEW_STORAGE_KEY)
    if (val === 'index' || val === 'table') return val
  } catch {
    // localStorage may be restricted or disabled
  }
  return 'index'
}

export function setStoredViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, mode)
  } catch {
    // localStorage may be restricted or disabled
  }
}

export function getStoredDensityMode(): DensityMode {
  try {
    const val = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (val === 'compact' || val === 'comfortable') return val
  } catch {
    // localStorage may be restricted or disabled
  }
  return 'comfortable'
}

export function setStoredDensityMode(mode: DensityMode): void {
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, mode)
  } catch {
    // localStorage may be restricted or disabled
  }
}

