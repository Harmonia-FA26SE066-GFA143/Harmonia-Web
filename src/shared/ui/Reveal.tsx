import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'

export interface RevealProps {
  children: ReactNode
  /** Element to render; use "li" inside a list. */
  as?: 'div' | 'li' | 'section'
  /** Stagger in ms for a row in a list; capped at 180ms like DESIGN.md "Continuity". */
  delay?: number
  className?: string
  style?: CSSProperties
}

/** Fades and rises once when it scrolls into view (`hm-reveal` in global.css). Visible at once under reduced motion. */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '', style }: Readonly<RevealProps>) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [seen, setSeen] = useState(false)

  const noObserver = typeof IntersectionObserver === 'undefined'
  const visible = seen || reduced || noObserver

  useEffect(() => {
    const node = ref.current
    if (visible || !node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return (
    <Tag
      ref={ref as never}
      className={`hm-reveal${visible ? ' is-visible' : ''} ${className}`.trim()}
      style={{ ...style, '--hm-delay': `${Math.min(delay, 180)}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
