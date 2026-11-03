import type { CSSProperties } from 'react'

/** `bare` for Lent (rings and spokes only), `radiant` for Easter (rays round the rim), `full` for every other season. */
export type RoseKind = 'full' | 'bare' | 'radiant'

const c = 140
const at = (r: number, a: number) => [c + r * Math.cos(a), c + r * Math.sin(a)] as const

function Spoke({ from, to, angle }: Readonly<{ from: number; to: number; angle: number }>) {
  const [x1, y1] = at(from, angle)
  const [x2, y2] = at(to, angle)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} />
}

const sixteenths = Array.from({ length: 16 }, (_, i) => (i / 16) * 2 * Math.PI)
const rays = Array.from({ length: 48 }, (_, i) => i)

/**
 * A rose window in line, drawn in Figma with the owner (2026-11-03, file "Harmonia – Họa tiết banner mùa") and set at
 * the right edge of the season banner, cut by it. Decoration only: hidden from readers, never a status.
 */
export function RoseWindow({ color, kind, style }: Readonly<{ color: string; kind: RoseKind; style?: CSSProperties }>) {
  return (
    <svg aria-hidden width={280} height={280} viewBox="0 0 280 280" fill="none" style={style}>
      <g stroke={color} strokeWidth={1.2}>
        {[116, 110, 82, 34].map((r) => (
          <circle key={r} cx={c} cy={c} r={r} />
        ))}
        {sixteenths.map((a) => (
          <Spoke key={a} from={34} to={82} angle={a} />
        ))}
        {kind !== 'bare' &&
          sixteenths.map((a) => {
            const m = a + Math.PI / 16
            const [lx, ly] = at(96, m)
            const [tx, ty] = at(60, m)
            return (
              <g key={a}>
                <circle cx={lx} cy={ly} r={13} />
                <circle cx={tx} cy={ty} r={9} />
              </g>
            )
          })}
        {kind !== 'bare' &&
          [0, 1, 2, 3].map((i) => {
            const [x, y] = at(10, (i * Math.PI) / 2 + Math.PI / 4)
            return <circle key={i} cx={x} cy={y} r={10} />
          })}
        <circle cx={c} cy={c} r={5} />
        {kind === 'radiant' &&
          rays.map((i) => <Spoke key={i} from={121} to={i % 2 ? 130 : 138} angle={(i / 48) * 2 * Math.PI} />)}
      </g>
    </svg>
  )
}
