import { useSyncExternalStore } from 'react'
import { onSessionCleared } from '@/lib/auth/session'
import { useChoirs } from './hooks/useChoirs'

const key = 'harmonia:current-choir'
const listeners = new Set<() => void>()

function read(): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    // Storage may be blocked: then every page shows all choirs.
    return undefined
  }
}

/** Sets the choir the Choir Director works in; undefined is every choir they lead. */
export function setCurrentChoir(choirId: string | undefined) {
  try {
    if (choirId) localStorage.setItem(key, choirId)
    else localStorage.removeItem(key)
  } catch {
    // Kept for this render only; nothing else depends on it being stored.
  }
  for (const listener of listeners) listener()
}

// Another account signing in on this browser starts with every choir again.
onSessionCleared(() => setCurrentChoir(undefined))

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * The choir picked in the running head (artifact Spine, choir switcher), kept in this browser. Only a choir the
 * Choir Director still leads and that is active counts (`GET api/choirs` lists their own, ChoirService.cs:55); any
 * other stored id reads as every choir.
 */
export function useCurrentChoir(): string | undefined {
  const stored = useSyncExternalStore(subscribe, read, () => undefined)
  const choirs = useChoirs(Boolean(stored))
  return choirs.data?.some((choir) => choir.id === stored && choir.isActive) ? stored : undefined
}
