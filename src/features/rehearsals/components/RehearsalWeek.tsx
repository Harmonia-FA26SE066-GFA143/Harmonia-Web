import { Card, Typography } from 'antd'
import dayjs from 'dayjs'
import type { LiturgicalProgram } from '@/features/liturgical-programs'
import { colors, spacing } from '@/styles/tokens'
import { rehearsalLabel } from '../rehearsalFormat'
import { isRehearsalDay, type Rehearsal } from '../types'

interface RehearsalWeekProps {
  weekStart: string
  rehearsals: Rehearsal[]
  programs: Map<string, LiturgicalProgram>
  onSelect: (rehearsal: Rehearsal) => void
}

export function RehearsalWeek({ weekStart, rehearsals, programs, onSelect }: Readonly<RehearsalWeekProps>) {
  const start = dayjs(weekStart)
  const days = Array.from({ length: 7 }, (_, index) => start.add(index, 'day'))
  const today = dayjs()

  return (
    <div className="rehearsal-week-grid" role="grid" aria-label="Lịch tập theo tuần">
      {days.map((day) => {
        const items = rehearsals
          .filter((rehearsal) => dayjs(rehearsal.startAt).format('YYYY-MM-DD') === day.format('YYYY-MM-DD'))
          .toSorted((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
        const isToday = day.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')
        return (
          <section
            key={day.format('YYYY-MM-DD')}
            className="rehearsal-week-day"
            role="gridcell"
            aria-label={`${day.format('dddd DD/MM')}${isToday ? ', hôm nay' : ''}`}
            style={{ borderRight: `1px solid ${colors.border}`, minWidth: 0 }}
          >
            <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, background: isToday ? colors.primarySoft : undefined }}>
              <Typography.Text strong>{day.format('dddd')}</Typography.Text>
              <div><Typography.Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{day.format('DD/MM')}</Typography.Text></div>
            </div>
            <div style={{ padding: spacing.sm, display: 'grid', gap: spacing.sm }}>
              {items.length === 0 ? (
                <Typography.Text aria-label="Không có buổi tập" type="secondary" style={{ padding: spacing.sm }}>—</Typography.Text>
              ) : items.map((rehearsal) => (
                <Card
                  key={rehearsal.id}
                  size="small"
                  hoverable
                  onClick={() => onSelect(rehearsal)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Xem chi tiết buổi tập ${rehearsalLabel(rehearsal)}`}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(rehearsal)
                    }
                  }}
                  styles={{ body: { padding: spacing.sm } }}
                >
                  <Typography.Text strong style={{ display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                    {dayjs(rehearsal.startAt).format('HH:mm')}–{dayjs(rehearsal.endAt).format('HH:mm')}
                  </Typography.Text>
                  <Typography.Text ellipsis={{ tooltip: true }} style={{ display: 'block' }}>
                    {rehearsal.eventId ? (programs.get(rehearsal.eventId)?.eventName ?? 'Xem chương trình') : 'Không gắn chương trình'}
                  </Typography.Text>
                  {rehearsal.locationName && <Typography.Text type="secondary" ellipsis={{ tooltip: rehearsal.locationName }} style={{ display: 'block' }}>{rehearsal.locationName}</Typography.Text>}
                  <Typography.Text type="secondary" style={{ display: 'block' }}>{rehearsal.songs.length} bài hát</Typography.Text>
                  {isRehearsalDay(rehearsal) && <Typography.Text type="secondary">Hôm nay</Typography.Text>}
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
