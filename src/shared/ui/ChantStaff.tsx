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
