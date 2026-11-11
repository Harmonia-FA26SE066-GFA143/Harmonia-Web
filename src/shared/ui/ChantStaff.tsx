import { colors } from '@/styles/tokens'

// Gregorian chant is written on four lines, traditionally ruled in red (owner 2026-11-03: "đậm chất nhà thờ").
const lines = [4, 11, 18, 25]
const width = 196

/**
 * A short incipit in square notation on a four-line staff: C clef, puncta, a podatus, a clivis, a quarter bar and a
 * custos. The staff is only as long as the phrase (owner 2026-11-03: a full-width staff read as ruled paper); the
 * parent places it. Decoration only: hidden from readers, never a status.
 */
export function ChantStaff({ color = colors.primary }: Readonly<{ color?: string }>) {
  return (
    <svg aria-hidden width={width} height={29} viewBox={`0 0 ${width} 29`} style={{ display: 'block' }}>
      <g stroke={color} strokeOpacity={0.35} strokeWidth={1}>
        {lines.map((y) => (
          <line key={y} x1={0} x2={width} y1={y + 0.5} y2={y + 0.5} />
        ))}
      </g>
      <g fill={color} fillOpacity={0.75}>
        {/* C clef on the second line */}
        <rect x={4} y={5} width={5} height={4} />
        <rect x={4} y={13} width={5} height={4} />
        <rect x={3} y={5} width={1.4} height={12} />
        <rect x={22} y={15} width={6} height={6} />
        <rect x={36} y={11.5} width={6} height={6} />
        {/* podatus: the lower note first, the stem on the right */}
        <rect x={50} y={15} width={6} height={6} />
        <rect x={50} y={8} width={6} height={6} />
        <rect x={54.8} y={11} width={1.2} height={7} />
        <rect x={66} y={4.5} width={6} height={6} />
        {/* clivis: the higher note first, the stem on the left */}
        <rect x={80} y={4.5} width={6} height={6} />
        <rect x={86} y={8} width={6} height={6} />
        <rect x={80} y={7.5} width={1.2} height={9} />
        <rect x={100} y={11.5} width={6} height={6} />
        <rect x={112} y={15} width={6} height={6} />
        <rect x={126} y={2} width={1.2} height={13} />
        <rect x={136} y={11.5} width={6} height={6} />
        <rect x={150} y={8} width={6} height={6} />
        <rect x={164} y={11.5} width={6} height={6} />
        {/* custos: the small guide note at the line's end */}
        <rect x={182} y={12} width={3.5} height={5} />
        <rect x={184.3} y={4} width={1} height={10} />
      </g>
    </svg>
  )
}

/** The page head's incipit: four lines and three square notes. Styled and animated by `.hm-incipit` in global.css. */
export function Incipit() {
  return (
    <svg className="hm-incipit" aria-hidden width={72} height={20} viewBox="0 0 72 20" style={{ flex: 'none' }}>
      {[0.5, 6.5, 12.5, 19.5].map((y) => (
        <line key={y} x1={0} x2={72} y1={y} y2={y} />
      ))}
      <rect x={40} y={8} width={5} height={5} />
      <rect x={50} y={2} width={5} height={5} />
      <rect x={60} y={8} width={5} height={5} />
    </svg>
  )
}

const ruled = (w: number) => lines.map((y) => <line key={y} x1={0} x2={w} y1={y + 0.5} y2={y + 0.5} />)

/** A staff with nothing written yet, a C clef at its head and a custos at its end (owner 2026-11-04): an empty state. */
export function EmptyStaff({ color = colors.primary }: Readonly<{ color?: string }>) {
  return (
    <svg aria-hidden width={240} height={29} viewBox="0 0 240 29" style={{ display: 'block' }}>
      <g stroke={color} strokeOpacity={0.45} strokeWidth={1}>
        {ruled(240)}
      </g>
      <g fill={color}>
        <rect x={4} y={5} width={5} height={4} />
        <rect x={4} y={13} width={5} height={4} />
        <rect x={3} y={5} width={1.4} height={12} />
        <rect x={226} y={12} width={3.5} height={5} />
        <rect x={228.3} y={4} width={1} height={10} />
      </g>
    </svg>
  )
}

/** The staff broken in the middle, its two halves out of line: loading was interrupted. Drawn in `currentColor`. */
export function BrokenStaff({ width = 160 }: Readonly<{ width?: number }>) {
  const half = width * 0.41
  const height = width < 60 ? 18 : 29
  const ys = width < 60 ? [2, 7, 12, 17] : lines
  return (
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <g stroke="currentColor" strokeOpacity={0.6} strokeWidth={1} strokeLinecap="round">
        {ys.map((y, i) => (
          <g key={y}>
            <line x1={1} x2={half} y1={y + 0.5} y2={y + 0.5} />
            <line x1={width - half} x2={width - 1} y1={y + (i % 2 ? 2 : -0.5)} y2={y + (i % 2 ? 2 : -0.5)} />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** The bare staff that holds the incipit's place while a page loads. */
export function StaffPlaceholder() {
  return (
    <svg aria-hidden width={width} height={29} viewBox={`0 0 ${width} 29`} style={{ display: 'block' }}>
      <g stroke={colors.primary} strokeOpacity={0.18} strokeWidth={1}>
        {ruled(width)}
      </g>
    </svg>
  )
}
