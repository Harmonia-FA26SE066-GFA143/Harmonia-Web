import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

const subscribe = (onChange: () => void) => {
  const list = window.matchMedia?.(query)
  list?.addEventListener('change', onChange)
  return () => list?.removeEventListener('change', onChange)
}

/** True when the viewer asked the system for less motion; follows the setting while the page is open. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false, () => false)
}
