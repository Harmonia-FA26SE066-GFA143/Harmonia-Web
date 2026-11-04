import { colors } from '@/styles/tokens'

const c = 32
const at = (r: number, a: number) => [c + r * Math.cos(a), c + r * Math.sin(a)] as const
const twelfths = Array.from({ length: 12 }, (_, i) => (i / 12) * 2 * Math.PI - Math.PI / 2)

/**
 * The app opening (owner 2026-11-04, Figma page "Trạng thái"): a small rose window whose lit lobe runs round the rim,
 * 1.2s a turn (`.hm-rose-spinner` in global.css), over a line of words. Shown while the app starts or reloads, before
 * it knows which layout comes; inside the app pages load with skeletons instead.
 */
export function RoseSpinner({ label }: Readonly<{ label: string }>) {
  return (
    <output aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg aria-hidden width={64} height={64} viewBox="0 0 64 64" fill="none" className="hm-rose-spinner">
        <g stroke={colors.primary} strokeWidth={1.2}>
          <circle cx={c} cy={c} r={30} strokeOpacity={0.4} />
          <circle cx={c} cy={c} r={8} strokeOpacity={0.4} />
          {twelfths.map((a) => {
            const [x1, y1] = at(8, a + Math.PI / 12)
            const [x2, y2] = at(26, a + Math.PI / 12)
            return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={0.25} />
          })}
          {twelfths.map((a, i) => {
            const [x, y] = at(20, a)
            return <circle key={a} className="hm-lobe" cx={x} cy={y} r={4.2} fill={colors.primary} strokeOpacity={0.6} style={{ animationDelay: `${i * 100 - 1200}ms` }} />
          })}
        </g>
        <circle cx={c} cy={c} r={2.5} fill={colors.primary} />
      </svg>
      <span style={{ color: colors.textBody }}>{label}</span>
    </output>
  )
}
