import type { CSSProperties, ReactNode } from 'react'
import type { MassTime } from '../massTime'

const ray = (cx: number, cy: number, r1: number, r2: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return <line key={deg} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} />
}

const star = (x: number, y: number, s: number, color: string) => {
  const k = s * 0.28
  return (
    <path
      key={`${x}-${y}`}
      d={`M${x} ${y - s}L${x + k} ${y - k}L${x + s} ${y}L${x + k} ${y + k}L${x} ${y + s}L${x - k} ${y + k}L${x - s} ${y}L${x - k} ${y - k}Z`}
      fill={color}
      stroke="none"
    />
  )
}

const inside: Record<MassTime, (color: string) => ReactNode> = {
  // The sun rising over the sill.
  morning: () => (
    <>
      <line x1={20} y1={92} x2={76} y2={92} />
      <g className="hm-mass-sun">
        <path d="M36 92a12 12 0 0 1 24 0" />
        {[-160, -140, -120, -100, -80, -60, -40, -20].map((d) => ray(48, 92, 16, d % 40 === 0 ? 26 : 22, d))}
      </g>
    </>
  ),
  // A low sun in the corner, its rays slanting.
  afternoon: () => (
    <>
      <line x1={20} y1={96} x2={76} y2={96} />
      <g className="hm-mass-sun">
        <path d="M54 96a9 9 0 0 1 18 0" />
        <g className="hm-mass-rays">{[-170, -155, -140, -125].map((d) => ray(63, 96, 12, d === -155 || d === -125 ? 34 : 26, d))}</g>
      </g>
    </>
  ),
  // A lit candle under three stars.
  evening: (color) => (
    <>
      <rect x={43} y={70} width={10} height={26} rx={1} />
      <line x1={36} y1={96} x2={60} y2={96} />
      <line x1={48} y1={66} x2={48} y2={70} />
      <path className="hm-mass-flame" d="M48 52c3 3.6 4.2 6.2 4.2 8.4a4.2 4.2 0 0 1-8.4 0c0-2.2 1.2-4.8 4.2-8.4z" fill={color} fillOpacity={0.5} />
      <circle className="hm-mass-halo" cx={48} cy={60} r={10} strokeOpacity={0.35} />
      <g className="hm-mass-stars">
        {star(31, 40, 4, color)}
        {star(64, 32, 3, color)}
        {star(68, 54, 2.5, color)}
      </g>
    </>
  ),
}

/**
 * An arch with the hour of the Mass inside it (drawn with the owner in Figma, 2026-11-03, page "Sáng – Chiều – Tối").
 * Decoration only: hidden from readers; "Lễ sáng / chiều / tối" is always written beside it. Hovering an element with
 * the `hm-mass-host` class moves the hour inside (the sun rises or sets, the flame flickers): global.css.
 */
export function MassTimeMark({ time, color, style }: Readonly<{ time: MassTime; color: string; style?: CSSProperties }>) {
  return (
    <svg aria-hidden className={`hm-mass-mark hm-mass-mark--${time}`} width={96} height={104} viewBox="0 0 96 104" fill="none" style={style}>
      <g stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 104V48a40 40 0 0 1 80 0v56" />
        <path d="M20 104V50a28 28 0 0 1 56 0v54" strokeOpacity={0.7} />
        {inside[time](color)}
      </g>
    </svg>
  )
}
