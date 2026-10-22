import { colors } from '@/styles/tokens'

/** Same seed, same notes: a song keeps its look between visits. */
function seeded(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return () => {
    hash = (hash * 1103515245 + 12345) | 0
    return ((hash >>> 16) & 0x7fff) / 0x7fff
  }
}

const noteGap = 34

/**
 * Decorative five-line staff with notes drawn from `seed`; hidden from assistive technology. Drawn at real pixel size
 * (no viewBox), so notes keep their shape at any width; notes past the right edge are clipped.
 */
export function StaffMotif({ seed, height = 56 }: Readonly<{ seed: string; height?: number }>) {
  const random = seeded(seed)
  const top = Math.round(height * 0.22)
  const lineGap = (height - top * 2) / 4
  const notes = Array.from({ length: 24 }, (_, index) => {
    // Half-line steps from the top line to the bottom line.
    const y = top + Math.round(random() * 8) * (lineGap / 2)
    return { x: 28 + index * noteGap + random() * 6, y, opacity: 0.55 + random() * 0.35 }
  })
  const stem = lineGap * 3

  return (
    <svg aria-hidden width="100%" height={height} style={{ display: 'block', overflow: 'hidden' }}>
      {[0, 1, 2, 3, 4].map((line) => (
        <line key={line} x1="0" x2="100%" y1={top + line * lineGap} y2={top + line * lineGap} stroke={colors.primary} strokeOpacity="0.28" />
      ))}
      {notes.map(({ x, y, opacity }, index) => {
        const stemUp = y > top + lineGap * 2
        return (
          <g key={index} fill={colors.primary} fillOpacity={opacity}>
            <ellipse cx={x} cy={y} rx={lineGap * 0.62} ry={lineGap * 0.45} transform={`rotate(-20 ${x} ${y})`} />
            <rect x={stemUp ? x + lineGap * 0.5 : x - lineGap * 0.6} y={stemUp ? y - stem : y} width="1.3" height={stem} />
          </g>
        )
      })}
    </svg>
  )
}
