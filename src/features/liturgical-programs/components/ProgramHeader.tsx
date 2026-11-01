import { Breadcrumb, Flex, Typography, type BreadcrumbProps } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { SeasonChip } from '@/shared/ui'
import { colors, gold, spacing, typography } from '@/styles/tokens'
import { formatProgramDate } from '../programFilters'

const staffLines = [0.5, 3.5, 6.5, 9.5, 12.5]

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
  const when = [`${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatProgramDate(date)}`, time, place].filter(Boolean).join(' · ')

  return (
    <header style={{ position: 'relative', marginBottom: spacing.lg, paddingBottom: spacing.xl }}>
      {/*
        The event-detail header is one of the three places the redesign's motifs may appear (brief §5): a faint arch
        standing on five staff lines, in decorative gold. Hidden from readers; the text carries everything.
      */}
      <svg aria-hidden width={88} height={64} viewBox="0 0 88 64" style={{ position: 'absolute', right: spacing.xl, bottom: 13 }}>
        <g fill="none" stroke={gold.line} strokeOpacity={0.45}>
          <path d="M4 64V36a40 40 0 0 1 80 0v28" />
          <path d="M18 64V38a26 26 0 0 1 52 0v26" strokeOpacity={0.6} />
        </g>
      </svg>
      <svg aria-hidden width="100%" height={13} style={{ position: 'absolute', left: 0, bottom: 0 }}>
        {staffLines.map((y) => (
          <line key={y} x1="0" x2="100%" y1={y} y2={y} stroke={gold.line} strokeOpacity={0.3} strokeWidth={1} />
        ))}
      </svg>
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
          <Typography.Text style={{ color: colors.textBody }}>{when}</Typography.Text>
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
