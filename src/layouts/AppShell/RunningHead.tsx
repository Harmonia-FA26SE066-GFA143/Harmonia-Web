import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useReducedMotion } from '@/shared/ui'
import { motion } from '@/styles/tokens'
import type { NavSection } from './navigation'

/** Sub-pixel font settling stays under this; a real overflow is at least one tab gap wider. */
const tabOverflowTolerance = 2

/**
 * Keeps a marker (the area pill with its active bar, the page underline) on the current item of `box`, gliding from where it was. Only
 * `transform` is animated: the width is set at once and the old width played back as a scale, which ends at scale 1.
 */
function useGlidingMarker(selector: string, duration: number, delay: number, changeKey: unknown) {
  const box = useRef<HTMLDivElement>(null)
  const marker = useRef<HTMLSpanElement>(null)
  const last = useRef<{ x: number; width: number } | null>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const item = box.current?.querySelector<HTMLElement>(selector)
      const el = marker.current
      if (!el) return
      el.style.opacity = item ? '1' : '0'
      if (!item) {
        last.current = null
        return
      }
      const next = { x: item.offsetLeft, width: item.offsetWidth }
      el.style.width = `${next.width}px`
      el.style.transform = `translateX(${next.x}px)`
      const from = last.current
      if (glide && !reduced && from && next.width > 0 && from.x !== next.x) {
        el.animate?.(
          [
            { transform: `translateX(${from.x}px) scaleX(${from.width / next.width})` },
            { transform: `translateX(${next.x}px)` },
          ],
          { duration, delay, easing: motion.ease, fill: 'backwards' },
        )
        // The active bar draws out from its middle once the marker has landed (transform-only, no opacity: 0).
        el.querySelector('.hm-pill__bar')?.animate?.(
          [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
          { duration: 240, delay: delay + duration * 0.6, easing: motion.ease, fill: 'backwards' },
        )
      }
      last.current = next
    }
    place(true)
    // The web fonts change every label's width after the first paint.
    const observer = new ResizeObserver(() => place(false))
    if (box.current) observer.observe(box.current)
    return () => observer.disconnect()
  }, [selector, duration, delay, changeKey, reduced])

  return { box, marker }
}

interface RunningHeadProps {
  sections: NavSection[]
  selectedPath: string | undefined
  brand: ReactNode
  controls: ReactNode
  /** The right end of the ivory band: today's season and the next Mass. */
  day?: ReactNode
  scrolled: boolean
}

/**
 * Navigation of the role workspaces on desktop, set like the head of a missal page (Harmonia Design System): the areas
 * on the bookcloth band, the current area's pages on the ivory band below. Areas are the sections of `navigation.ts`,
 * so routes and role menus are unchanged. An area links to its first page.
 */
export function RunningHead({ sections, selectedPath, brand, controls, day, scrolled }: Readonly<RunningHeadProps>) {
  const found = sections.findIndex((section) => section.items.some((item) => item.path === selectedPath))
  const areaIndex = Math.max(found, 0)
  const area = sections[areaIndex]

  const { box: areasBox, marker: pill } = useGlidingMarker('[aria-current="true"]', 320, 0, areaIndex)
  const { box: tabsBox, marker: underline } = useGlidingMarker('[aria-current="page"]', 280, 60, selectedPath)

  // A page strip may still be wider than the band when contextual controls take space. Measure the list itself:
  // the absolutely positioned underline and sub-pixel font settling must not create a false faded edge.
  useEffect(() => {
    const box = tabsBox.current
    if (!box) return
    const list = box.querySelector<HTMLElement>('.hm-tabs__list')
    if (!list) return
    // R2.7: an edge fades only when the tabs truly overflow the strip, never because the strip is still settling.
    const mark = () => {
      const hasOverflow = list.scrollWidth > box.clientWidth + tabOverflowTolerance
      box.classList.toggle('has-more-start', hasOverflow && box.scrollLeft > tabOverflowTolerance)
      box.classList.toggle(
        'has-more-end',
        hasOverflow && box.scrollLeft + box.clientWidth < list.scrollWidth - tabOverflowTolerance,
      )
    }
    const wheel = (event: WheelEvent) => {
      if (
        list.scrollWidth <= box.clientWidth + tabOverflowTolerance ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX)
      ) return
      event.preventDefault()
      box.scrollLeft += event.deltaY
    }
    // Also when the strip or its tabs change width: the web font lands after the first layout and widens them.
    const settle = () => {
      box.querySelector('[aria-current="page"]')?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })
      mark()
    }
    settle()
    box.addEventListener('scroll', mark, { passive: true })
    box.addEventListener('wheel', wheel, { passive: false })
    const observer = new ResizeObserver(settle)
    observer.observe(box)
    observer.observe(list)
    // The day loads after the head and take their width from the band.
    if (box.parentElement) observer.observe(box.parentElement)
    let cancelled = false
    void document.fonts?.ready.then(() => {
      if (!cancelled) settle()
    })
    return () => {
      cancelled = true
      box.removeEventListener('scroll', mark)
      box.removeEventListener('wheel', wheel)
      observer.disconnect()
    }
  }, [tabsBox, selectedPath, areaIndex])

  return (
    <header className={`hm-head${scrolled ? ' is-scrolled' : ''}`}>
      <div className="hm-top">
        {brand}
        <nav aria-label="Điều hướng chính" style={{ minWidth: 0 }}>
          <div ref={areasBox} className="hm-areas">
            <span ref={pill} className="hm-pill" aria-hidden>
              <span className="hm-pill__bar" />
            </span>
            {sections.map((section, index) => (
              <Link
                key={section.label}
                to={section.items[0].path}
                className="hm-area"
                aria-current={found === index ? 'true' : undefined}
              >
                {section.label}
                <AreaWaitingDot items={section.items} />
              </Link>
            ))}
          </div>
        </nav>
        <div className="hm-top__end">{controls}</div>
      </div>
      <nav className="hm-sub" aria-label={`Các trang của ${area.label}`}>
        <div ref={tabsBox} className="hm-tabs">
          <span ref={underline} className="hm-underline" aria-hidden />
          <div key={areaIndex} className="hm-tabs__list">
            {area.items.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className="hm-tab"
                style={{ '--k': index } as CSSProperties}
                aria-current={item.path === selectedPath ? 'page' : undefined}
              >
                {item.label}
                {item.useCount && <TabCount useCount={item.useCount} />}
              </Link>
            ))}
          </div>
        </div>
        {day}
      </nav>
    </header>
  )
}

/** The number waiting on a tab; read aloud with the tab name, hidden while it is none. */
function TabCount({ useCount }: Readonly<{ useCount: () => number | undefined }>) {
  const count = useCount()
  if (!count) return null
  // The space keeps the name and the number apart when read aloud; a flex row does not draw it.
  return (
    <>
      {' '}
      <span className="hm-tab__count">
        {count}{' '}
        <span className="hm-visually-hidden">đang chờ</span>
      </span>
    </>
  )
}

/** One aggregated ochre dot per area when any of its pages has items waiting; never duplicates dots or SR text. */
function AreaWaitingDot({ items }: Readonly<{ items: NavSection['items'] }>) {
  // Hooks are called in fixed order matching the static navigation config of each section.
  let waiting = false
  for (const item of items) {
    if (item.useCount && item.useCount()) waiting = true
  }
  if (!waiting) return null
  return (
    <>
      {' '}
      <span className="hm-area__dot" aria-hidden />
      <span className="hm-visually-hidden">có việc đang chờ</span>
    </>
  )
}
