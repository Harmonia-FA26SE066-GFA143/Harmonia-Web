import { Breadcrumb, Flex, Typography, type BreadcrumbProps } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { ChantStaff, SeasonChip } from '@/shared/ui'
import { colors, gold, spacing, typography } from '@/styles/tokens'
import { formatProgramDate } from '../programFilters'
import { massTimeLabels, massTimeOf } from '../massTime'
import { MassTimeMark } from './MassTimeMark'

export interface ProgramHeaderProps {
  title: string
  /** YYYY-MM-DD and HH:mm. */
  date: string
  time?: string
  place?: string
  /** The Admin's catalog name of the program's season; shown as a chip without colour. */
  seasonName?: string
  /** The event's status mark, for the Priest. */
  status?: ReactNode
  /** Mass or ceremony type and the special requirements, on one quiet line. */
  details?: string
  breadcrumb?: BreadcrumbProps['items']
  actions?: ReactNode
}

/**
 * The head of a program page, set like the top of a missal page: season chip, the celebration's name in the display
 * serif, then its weekday, date, time and place. The page's single h1.
 */
export function ProgramHeader({ title, date, time, place, seasonName, status, details, breadcrumb, actions }: Readonly<ProgramHeaderProps>) {
  const weekday = dayjs(date).format('dddd')
  const hour = massTimeOf(time)
  const day = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatProgramDate(date)}`

  return (
    <header style={{ position: 'relative', marginBottom: spacing.lg, paddingBottom: spacing.md }}>
      {/*
        The head of a chant page (owner 2026-11-03): an arch holding the hour of the Mass (sunrise, low sun, or a candle
        under stars) beside a four-line staff with neumes. Hidden from readers; the text carries everything.
      */}
      {hour && (
        <MassTimeMark
          time={hour}
          color={hour === 'evening' ? colors.primary : gold.line}
          style={{ position: 'absolute', right: 248, bottom: 0, opacity: hour === 'evening' ? 0.55 : 0.8 }}
        />
      )}
      <div style={{ position: 'absolute', right: spacing.lg, bottom: 0 }}>
        <ChantStaff />
      </div>
      {breadcrumb && <Breadcrumb items={breadcrumb} style={{ marginBottom: spacing.sm, fontSize: typography.metadata.fontSize, fontWeight: 500 }} />}
      <Flex wrap align="flex-start" justify="space-between" gap={spacing.md} style={{ position: 'relative' }}>
        <Flex vertical gap={spacing.xs} style={{ minWidth: 0, flex: '1 1 480px' }}>
          {(seasonName || status) && (
            <Flex wrap align="center" gap={spacing.sm}>
              {seasonName && <SeasonChip seasonName={seasonName} />}
              {status}
            </Flex>
          )}
          <Typography.Title
            level={1}
            style={{ margin: 0, fontFamily: typography.displayFontFamily, fontSize: 36, fontWeight: 600, lineHeight: 1.25 }}
          >
            {title}
          </Typography.Title>
          <Typography.Text style={{ color: colors.textBody }}>
            {day}
            {(hour || time) && ' · '}
            {hour && <strong style={{ color: gold.ink }}>{massTimeLabels[hour]} </strong>}
            {[time, place].filter(Boolean).join(' · ')}
          </Typography.Text>
          {details && <Typography.Text style={{ color: colors.textMuted, maxWidth: '72ch' }}>{details}</Typography.Text>}
        </Flex>
        {actions && (
          <Flex wrap align="center" gap={spacing.sm} style={{ flexShrink: 0 }}>
            {actions}
          </Flex>
        )}
      </Flex>
    </header>
  )
}
