import { useCallback, useEffect, useRef, useState } from 'react'

/** True for a moment after `markSaved`, while a save button says so in its own place. */
export function useJustSaved(holdMs = 1800) {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const markSaved = useCallback(() => {
    setSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), holdMs)
  }, [holdMs])

  return [saved, markSaved] as const
}
