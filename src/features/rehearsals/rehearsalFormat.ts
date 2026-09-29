import dayjs from 'dayjs'
import type { Rehearsal } from './types'

/** "Thứ Sáu, 18/09/2026 · 19:30–21:00" */
export function formatRehearsalTime({ startAt, endAt }: Pick<Rehearsal, 'startAt' | 'endAt'>): string {
  const start = dayjs(startAt)
  const weekday = start.format('dddd')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${start.format('DD/MM/YYYY')} · ${start.format('HH:mm')}–${dayjs(endAt).format('HH:mm')}`
}

/** Short label for pickers: "Tập chính ráp 4 bè · 18/09 19:30". */
export const rehearsalLabel = ({ name, startAt }: Pick<Rehearsal, 'name' | 'startAt'>) =>
  `${name} · ${dayjs(startAt).format('DD/MM HH:mm')}`
