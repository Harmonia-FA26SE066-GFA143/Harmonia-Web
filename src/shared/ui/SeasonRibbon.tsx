import { Typography } from 'antd'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { seasonTone } from './seasonTones'

export interface SeasonRibbonProps {
  /** The calendar's season code (`LiturgicalDayDto.SeasonName`): Advent, Christmas, Lent, Easter or OrdinaryTime. */
  seasonKey?: string
  /** The season in words, as the backend names it; always shown, so colour never carries the season alone. */
  seasonName: string
  /** The day's celebration, e.g. "Thứ Bảy tuần XXX Thường niên". */
  celebrationName?: string
}

const staffLines = [0.5, 3.5, 6.5, 9.5, 12.5]

/**
 * The current liturgical season on an ivory band: a missal ribbon in the season's colour, the season name in the
 * display serif, the day's celebration under it, and a faint arch over five staff lines. Season colour appears only
 * here and in a season chip (brief 2026-10-31).
 */
export function SeasonRibbon({ seasonKey, seasonName, celebrationName }: Readonly<SeasonRibbonProps>) {
  const tone = seasonTone(seasonKey)

  return (
    <section
      aria-label="Mùa phụng vụ hôm nay"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: colors.ivory,
        border: `1px solid ${tone.border}`,
        borderRadius: radius.lg,
        padding: `${spacing.md}px ${spacing.lg}px ${tone.motif ? spacing.xl : spacing.md}px 72px`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: spacing.lg,
          width: 18,
          height: 60,
          background: tone.ribbon,
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
        }}
      />
      {tone.motif && (
        <>
          <svg
            aria-hidden
            viewBox="0 0 96 80"
            width={96}
            height={80}
            // Standing on the staff below (bottom 8 + 13px).
            style={{ position: 'absolute', right: 40, bottom: 21 }}
          >
            <g fill="none" stroke={tone.ribbon} strokeOpacity={0.45}>
              <path d="M4 80V40a44 44 0 0 1 88 0v40" />
              <path d="M18 80V42a30 30 0 0 1 60 0v38" strokeOpacity={0.6} />
            </g>
          </svg>
          <svg aria-hidden width="100%" height={13} style={{ position: 'absolute', left: 0, bottom: spacing.sm }}>
            {staffLines.map((y) => (
              <line key={y} x1="0" x2="100%" y1={y} y2={y} stroke={tone.ribbon} strokeOpacity={0.3} strokeWidth={1} />
            ))}
          </svg>
        </>
      )}
      <p
        style={{
          position: 'relative',
          margin: 0,
          fontFamily: typography.displayFontFamily,
          fontSize: 32,
          fontWeight: 600,
          lineHeight: 1.25,
          color: tone.name,
        }}
      >
        {seasonName}
      </p>
      {celebrationName && (
        <Typography.Text style={{ position: 'relative', color: colors.textBody }}>{celebrationName}</Typography.Text>
      )}
    </section>
  )
}
