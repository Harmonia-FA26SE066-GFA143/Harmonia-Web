import dayjs from 'dayjs'
import { parseUtc } from '@/lib/api/dates'

/** A backend `DateTime` in the browser's time. */
export const formatDateTime = (value: string) => dayjs(parseUtc(value)).format('DD/MM/YYYY HH:mm')

export const formatDuration = (seconds: number | null) =>
  seconds === null ? '—' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

/** An event of `GET /api/schedule/events` in a select: title, local date and time, place. */
export const formatEventOption = (event: { title: string | null; eventDate: string; time: string; locationName: string }) =>
  [event.title || 'Sự kiện', dayjs(`${event.eventDate}T${event.time}`).format('DD/MM/YYYY HH:mm'), event.locationName].join(' · ')
