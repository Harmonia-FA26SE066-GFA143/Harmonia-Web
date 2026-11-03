export type MassTime = 'morning' | 'afternoon' | 'evening'

/**
 * The part of the day a Mass falls in, from its local start time (HH:mm). The BE has only the time; the bands are the
 * owner's (2026-11-03): morning before 11:00, afternoon 11:00–16:59, evening from 17:00. Interpreted, not a BE field.
 */
export function massTimeOf(time?: string): MassTime | undefined {
  const hour = Number(time?.slice(0, 2))
  if (!time || Number.isNaN(hour)) return undefined
  if (hour < 11) return 'morning'
  return hour < 17 ? 'afternoon' : 'evening'
}

export const massTimeLabels: Record<MassTime, string> = {
  morning: 'Lễ sáng',
  afternoon: 'Lễ chiều',
  evening: 'Lễ tối',
}
