import dayjs from 'dayjs'
import type { PracticeAudience } from './types'

export function describeAudience(audience: PracticeAudience): string {
  if (audience.kind === 'all') return 'Tất cả ca viên đã xác nhận'
  if (audience.kind === 'skills') return `Kỹ năng: ${audience.skills.join(', ')}`
  return `${audience.members.length} ca viên được chọn`
}

export const formatDateTime = (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—')

export const formatDuration = (seconds?: number) =>
  seconds === undefined ? '—' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
