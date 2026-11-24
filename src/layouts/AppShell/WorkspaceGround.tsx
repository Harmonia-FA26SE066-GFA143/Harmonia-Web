const center = { x: 1388, y: 52 }
const onCircle = (step: number, r: number) => ({
  x: center.x + r * Math.cos(step),
  y: center.y + r * Math.sin(step),
})
const turns = (count: number, offset = 0) => Array.from({ length: count }, (_, k) => ((k + offset) * 2 * Math.PI) / count)

/**
 * The ground of the workspaces (Harmonia Design System): a faint rose window in the top-right corner, fixed while the
 * page scrolls over it. The page of chant in the lower right was dropped (owner 2026-11-24: it ran behind tables as
 * noise). Decoration only; coloured by `.hm-ground` in global.css.
 */
export function WorkspaceGround() {
  return (
    <svg className="hm-ground" viewBox="0 0 1440 799" preserveAspectRatio="xMaxYMax slice" aria-hidden focusable={false}>
      <defs>
        <radialGradient id="hm-ground-light" cx="1300" cy="-40" r="760" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'var(--hm-surface-base)', stopOpacity: 0.9 }} />
          <stop offset="1" style={{ stopColor: 'var(--hm-surface-base)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <rect width="1440" height="799" fill="url(#hm-ground-light)" />
      <g className="hm-ground__rose">
        {[300, 262, 196, 128, 64, 26].map((r) => (
          <circle key={r} cx={center.x} cy={center.y} r={r} />
        ))}
        {turns(16).map((a) => {
          const from = onCircle(a, 26)
          const to = onCircle(a, 262)
          return <line key={a} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
        })}
        {turns(16, 0.5).map((a) => {
          const petal = onCircle(a, 229)
          return <circle key={a} cx={petal.x} cy={petal.y} r={29} />
        })}
        {turns(8, 0.5).map((a) => {
          const lobe = onCircle(a, 96)
          return <circle key={a} cx={lobe.x} cy={lobe.y} r={24} />
        })}
      </g>
    </svg>
  )
}
