import type { ReactNode } from 'react'
import { colors, radius } from '@/styles/tokens'

/** Square tile in the primary tint holding a decorative icon at half its size. */
export function IconTile({ size, children }: Readonly<{ size: number; children: ReactNode }>) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius.md,
        background: colors.primarySoft,
        color: colors.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size / 2,
      }}
    >
      {children}
    </div>
  )
}
