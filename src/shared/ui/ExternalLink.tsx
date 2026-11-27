import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Icon } from './icons'

export interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> {
  href: string
  children: ReactNode
  /** Inherit surrounding text colour instead of Parish Burgundy (e.g. dark focus mode surfaces). */
  inheritColor?: boolean
  /** Render the trailing external-link glyph (default `true`). */
  showIcon?: boolean
}

/**
 * Canonical external link contract:
 * - Always sets `target="_blank"` and `rel="noopener noreferrer"`.
 * - Displays a subtle trailing external-link icon and exposes `aria-description="Mở trong tab mới"` without mutating
 *   the link's accessible name (preserving WCAG 2.5.3 Label in Name).
 */
export function ExternalLink({
  href,
  children,
  inheritColor = false,
  showIcon = true,
  className,
  'aria-description': ariaDescription = 'Mở trong tab mới',
  ...props
}: Readonly<ExternalLinkProps>) {
  const classes = ['hm-external-link', inheritColor ? 'hm-external-link--inherit' : undefined, className]
    .filter(Boolean)
    .join(' ')

  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-description={ariaDescription}
      className={classes}
    >
      <span>{children}</span>
      {showIcon && <Icon name="export" size="xs" className="hm-external-link__icon" />}
    </a>
  )
}
