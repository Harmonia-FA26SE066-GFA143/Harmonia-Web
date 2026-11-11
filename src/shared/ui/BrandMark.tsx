import type { CSSProperties } from 'react'
import mark from '@/assets/images/brand/harmonia-mark-mono-white.svg'
import { colors } from '@/styles/tokens'

/**
 * Harmonia logo tile: the monoline H of the Stitch brand set (owner choice 2026-10-22) in white on Parish Burgundy
 * (Harmonia Design System, owner 2026-11-10), the same tile as `public/favicon.svg`. Decorative, since the name "Harmonia"
 * is always written beside it.
 */
export function BrandMark({ size, style }: Readonly<{ size: number; style?: CSSProperties }>) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        // Same corner as the favicon tile (rx 24 of 120).
        borderRadius: size * 0.2,
        background: colors.brand,
        ...style,
      }}
    >
      <img src={mark} alt="" width={size} height={size} style={{ display: 'block' }} />
    </div>
  )
}
