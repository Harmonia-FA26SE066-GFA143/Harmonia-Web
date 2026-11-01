import { colors, radius, spacing, typography } from '@/styles/tokens'
import { seasonTone } from './seasonTones'

export interface SeasonChipProps {
  /** The season in words; always shown, so colour never carries the season alone. */
  seasonName: string
  /**
   * The calendar's season code (Advent, Christmas, Lent, Easter, OrdinaryTime). Without it the chip has no swatch:
   * a program's season is the Admin's catalog name, which carries no colour (owner choice 2026-10-31).
   */
  seasonKey?: string
  size?: 'default' | 'small'
}

/** The season as a small chip: a swatch in the season's colour beside its name. Season colour lives only here and in SeasonRibbon. */
export function SeasonChip({ seasonName, seasonKey, size = 'default' }: Readonly<SeasonChipProps>) {
  const small = size === 'small'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: small ? spacing.xs : spacing.sm,
        maxWidth: '100%',
        padding: `0 ${small ? spacing.xs : spacing.sm}px`,
        borderRadius: radius.sm,
        border: `1px solid ${colors.border}`,
        background: colors.ivory,
        color: colors.textBody,
        // 12px is the smallest text of the scale, even in a calendar cell.
        fontSize: typography.metadata.fontSize,
        lineHeight: small ? '20px' : '22px',
        whiteSpace: 'nowrap',
      }}
    >
      {seasonKey && (
        <span aria-hidden style={{ width: small ? 6 : 8, height: small ? 10 : 12, flexShrink: 0, background: seasonTone(seasonKey).ribbon }} />
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{seasonName}</span>
    </span>
  )
}
