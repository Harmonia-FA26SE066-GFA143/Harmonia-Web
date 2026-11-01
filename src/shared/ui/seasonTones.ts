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

// From the calendar's season code (`LiturgicalDayDto.SeasonName`): Advent and Lent purple, Ordinary Time green,
// Christmas and Easter white with gold. An unknown code keeps the neutral burgundy. A day's own liturgical colour
// (`LiturgicalDayDto.Color`, BE 90af733, B45) wins over its season, so red and rose days show; it is null until the
// Parish Priest syncs the year again.
const tones = new Map<string, SeasonTone>([
  ['Advent', { ribbon: seasonColors.purple.cloth, name: seasonColors.purple.ink, border: hairline, motif: true }],
  ['Lent', { ribbon: seasonColors.purple.cloth, name: seasonColors.purple.ink, border: hairline, motif: false }],
  ['OrdinaryTime', { ribbon: seasonColors.green.cloth, name: seasonColors.green.ink, border: hairline, motif: true }],
  ['Christmas', { ribbon: gold.line, name: colors.textPrimary, border: gold.line, motif: true }],
  ['Easter', { ribbon: gold.line, name: colors.textPrimary, border: gold.line, motif: true }],
])
const neutral: SeasonTone = { ribbon: colors.primary, name: colors.textPrimary, border: hairline, motif: true }

const dayColours = new Map<string, Omit<SeasonTone, 'motif'>>([
  ['white', { ribbon: gold.line, name: colors.textPrimary, border: gold.line }],
  ['red', { ribbon: seasonColors.red.cloth, name: seasonColors.red.ink, border: hairline }],
  ['green', { ribbon: seasonColors.green.cloth, name: seasonColors.green.ink, border: hairline }],
  ['purple', { ribbon: seasonColors.purple.cloth, name: seasonColors.purple.ink, border: hairline }],
  ['rose', { ribbon: seasonColors.rose.cloth, name: seasonColors.rose.ink, border: hairline }],
  ['black', { ribbon: seasonColors.black.cloth, name: seasonColors.black.ink, border: hairline }],
])

/** The season's tone, in the day's liturgical colour when it is known; the motif follows the season (Lent stays bare). */
export const seasonTone = (seasonKey?: string, color?: string): SeasonTone => {
  const season = (seasonKey && tones.get(seasonKey)) || neutral
  const day = color ? dayColours.get(color) : undefined
  return day ? { ...day, motif: season.motif } : season
}
