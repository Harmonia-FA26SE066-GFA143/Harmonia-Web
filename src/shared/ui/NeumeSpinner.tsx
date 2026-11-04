import type { CSSProperties } from 'react'

const puncta = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * 2 * Math.PI - Math.PI / 2
  return { i, x: 12 + 8.16 * Math.cos(a), y: 12 + 8.16 * Math.sin(a) }
})

/**
 * The loading mark (owner 2026-11-04, Figma page "Trạng thái"): eight square puncta in a ring, one lit and stepping
 * clockwise with three fading behind it, 0.8s a turn (`.hm-neume-spinner` in global.css; still under reduced motion).
 * Drawn in `currentColor`, so it takes the text colour of the button or the spin area it sits in. Ant Design passes
 * `className` when it is the Spin indicator.
 */
export function NeumeSpinner({ size = 16, className, style }: Readonly<{ size?: number; className?: string; style?: CSSProperties }>) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={['hm-neume-spinner', className].filter(Boolean).join(' ')}
      style={style}
    >
      {puncta.map(({ i, x, y }) => (
        <rect
          key={i}
          x={x - 2.4}
          y={y - 2.4}
          width={4.8}
          height={4.8}
          fill="currentColor"
          transform={`rotate(${i * 45} ${x} ${y})`}
          style={{ animationDelay: `${i * 100 - 800}ms` }}
        />
      ))}
    </svg>
  )
}
