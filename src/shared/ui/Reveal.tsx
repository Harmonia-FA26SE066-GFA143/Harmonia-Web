import { type CSSProperties, type ReactNode } from 'react'

export interface RevealProps {
  children: ReactNode
  /** Element to render; use "li" inside a list. */
  as?: 'div' | 'li' | 'section'
  /** Optional stagger delay in ms (kept for API compatibility). */
  delay?: number
  className?: string
  style?: CSSProperties
}

/**
 * Renders content immediately visible (R2.1: zero animation-gated `opacity: 0` traps),
 * with an optional non-hiding subtle entrance transform when motion is allowed.
 */
export function Reveal({ children, as: Tag = 'div', delay = 0, className = '', style }: Readonly<RevealProps>) {
  return (
    <Tag
      className={`hm-reveal is-visible ${className}`.trim()}
      style={{ ...style, '--hm-delay': `${Math.min(delay, 180)}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
