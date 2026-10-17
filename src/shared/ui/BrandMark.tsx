import type { CSSProperties } from 'react'
import { brandGradient, radius } from '@/styles/tokens'

/** Harmonia logo tile; decorative, since the name "Harmonia" is always written beside it. */
export function BrandMark({ size, style }: Readonly<{ size: number; style?: CSSProperties }>) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius.md,
        background: brandGradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(142, 59, 75, 0.28)',
        ...style,
      }}
    >
      <svg width="56%" height="56%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4V20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18 4V20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M6 12H18" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="7" r="1.5" fill="#F3C68F" />
        <path d="M9.5 17C11 16 13 16 14.5 17" stroke="#F3C68F" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}
