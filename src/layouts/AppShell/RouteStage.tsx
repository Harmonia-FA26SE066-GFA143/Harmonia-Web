import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigation } from 'react-router'
import { motion } from '@/styles/tokens'
import { RoseSpinner, useReducedMotion } from '@/shared/ui'

/** A page still loading after this shows the rose; a faster one never flashes it. */
const SLOW_PAGE_MS = 300

/**
 * The page content of the shell, the only part that moves when the page changes: the running head, bell and account
 * stay still. The old page dims for 100ms while the next is fetched; the new page rises 4px and fades in (220ms; 480ms for the first page of a workspace, after sign-in).
 * One movement for the page head and its content together. Instant under reduced motion.
 */
export function RouteStage({ children }: Readonly<{ children: ReactNode }>) {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const [slow, setSlow] = useState(false)

  useLayoutEffect(() => {
    const opening = first.current
    first.current = false
    if (reduced || !stage.current?.animate) return
    stage.current.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
      duration: opening ? motion.reveal : motion.base,
      easing: motion.ease,
    })
  }, [pathname, reduced])

  // A lazily loaded page (its code chunk) may take a while on a slow network: say so only past SLOW_PAGE_MS.
  const loading = navigation.state === 'loading'
  // Only a move to another page dims the old one (100ms); a new ?tab= or filter on the same page does not.
  const leaving = loading && navigation.location?.pathname !== pathname
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setSlow(true), SLOW_PAGE_MS)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [loading])

  return (
    <div style={{ position: 'relative' }} aria-busy={slow || undefined}>
      <div ref={stage} className={leaving ? 'hm-route-leaving' : undefined}>
        {children}
      </div>
      {slow && (
        <div className="hm-route-wait">
          <RoseSpinner label="Đang mở trang…" />
        </div>
      )}
    </div>
  )
}
