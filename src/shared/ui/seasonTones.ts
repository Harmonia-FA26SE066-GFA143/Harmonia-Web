import { colors, gold, seasonColors } from '@/styles/tokens'

export interface SeasonTone {
  /** The missal ribbon, the chip swatch and the motif strokes. */
  ribbon: string
  /** The season name on ivory. */
  name: string
  border: string
  /** Staff lines and arch in the banner; Lent stays bare. */
  motif: boolean
}

const hairline = 'rgba(0, 0, 0, 0.07)'

// Interpreted: the backend has no liturgical colour (PRODUCT.md), so it is derived here from the calendar's season
// code (`LiturgicalDayDto.SeasonName`): Advent and Lent purple, Ordinary Time green, Christmas and Easter white with
// gold. An unknown code keeps the neutral burgundy.
const tones = new Map<string, SeasonTone>([
  ['Advent', { ribbon: seasonColors.purple.cloth, name: seasonColors.purple.ink, border: hairline, motif: true }],
  ['Lent', { ribbon: seasonColors.purple.cloth, name: seasonColors.purple.ink, border: hairline, motif: false }],
  ['OrdinaryTime', { ribbon: seasonColors.green.cloth, name: seasonColors.green.ink, border: hairline, motif: true }],
  ['Christmas', { ribbon: gold.line, name: colors.textPrimary, border: gold.line, motif: true }],
  ['Easter', { ribbon: gold.line, name: colors.textPrimary, border: gold.line, motif: true }],
])
const neutral: SeasonTone = { ribbon: colors.primary, name: colors.textPrimary, border: hairline, motif: true }

export const seasonTone = (seasonKey?: string): SeasonTone => (seasonKey && tones.get(seasonKey)) || neutral
