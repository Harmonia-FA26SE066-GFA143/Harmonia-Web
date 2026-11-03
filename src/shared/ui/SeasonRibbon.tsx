import { Typography } from 'antd'
import { colors, gold, radius, spacing, typography } from '@/styles/tokens'
import { RoseWindow } from './RoseWindow'
import { seasonTone } from './seasonTones'

export interface SeasonRibbonProps {
  /** The calendar's season code (`LiturgicalDayDto.SeasonName`): Advent, Christmas, Lent, Easter or OrdinaryTime. */
  seasonKey?: string
  /** The day's liturgical colour (white, red, green, purple, rose, black); it wins over the season's. */
  color?: string
  /** The season in words, as the backend names it; always shown, so colour never carries the season alone. */
  seasonName: string
  /** The day's celebration, e.g. "Thứ Bảy tuần XXX Thường niên". */
  celebrationName?: string
}

/**
 * The current liturgical season on an ivory band: a missal ribbon in the season's colour, the season name in the
 * display serif, the day's celebration under it, and a rose window in the season's colour at the right edge (owner
 * 2026-11-03: bare for Lent, radiant for Easter). Season colour appears only here and in a season chip.
 */
export function SeasonRibbon({ seasonKey, color, seasonName, celebrationName }: Readonly<SeasonRibbonProps>) {
  const tone = seasonTone(seasonKey, color)

  return (
    <section
      aria-label="Mùa phụng vụ hôm nay"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: colors.ivory,
        border: `1px solid ${tone.border}`,
        borderRadius: radius.lg,
        padding: `${spacing.lg}px ${spacing.lg}px ${spacing.lg}px 72px`,
      }}
    >
      <span
        aria-hidden
        className="hm-unroll"
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
      {/* Its centre 40px in from the right edge, cut by the banner (the Figma drawing). */}
      <RoseWindow
        color={tone.ribbon}
        kind={tone.rose}
        style={{
          position: 'absolute',
          right: -100,
          top: '50%',
          transform: 'translateY(-50%)',
          // Gold is pale and takes more ink; Lent's bare window stays faintest.
          opacity: tone.rose === 'bare' ? 0.35 : tone.ribbon === gold.line ? 0.85 : 0.5,
        }}
      />
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
