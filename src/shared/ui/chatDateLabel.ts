import dayjs from 'dayjs'
import { parseUtc } from '@/lib/api/dates'

function toDayjs(value: dayjs.ConfigType) {
  return typeof value === 'string' ? dayjs(parseUtc(value)) : dayjs(value)
}

/** Formats a message timestamp into canonical Vietnamese chat day group labels (`Hôm nay`, `Hôm qua`, `DD/MM/YYYY`). */
export function formatChatDateLabel(isoDate: string, now: dayjs.ConfigType = dayjs()): string {
  if (!isoDate.trim()) return ''
  const parsed = toDayjs(isoDate)
  const todayParsed = toDayjs(now)
  if (!parsed.isValid() || !todayParsed.isValid()) return ''
  const target = parsed.startOf('day')
  const today = todayParsed.startOf('day')
  if (target.isSame(today, 'day')) return 'Hôm nay'
  if (target.isSame(today.subtract(1, 'day'), 'day')) return 'Hôm qua'
  return target.format('DD/MM/YYYY')
}
