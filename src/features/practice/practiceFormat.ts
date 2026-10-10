import dayjs from 'dayjs'
import { parseUtc } from '@/lib/api/dates'

/** A backend `DateTime` in the browser's time. */
export const formatDateTime = (value: string) => dayjs(parseUtc(value)).format('DD/MM/YYYY HH:mm')

export const formatDuration = (seconds: number | null) =>
  seconds === null ? '—' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
