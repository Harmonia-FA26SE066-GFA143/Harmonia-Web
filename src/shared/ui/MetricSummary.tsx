import { AppstoreOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Card, Flex } from 'antd'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { cardSurface, colors, spacing } from '@/styles/tokens'
import { IconTile } from './IconTile'

export interface MetricSummaryProps {
  /** `to` turns the card into a link to the page where the counted items are handled. */
  definitions: { key: string; label: string; icon?: ComponentType; to?: string }[]
  values: Record<string, number | undefined>
}

const cardFlex = '1 1 200px'

/** Row of summary counts; a missing value shows "—" instead of a guess. Each card is a term and its value (dl). */
export function MetricSummary({ definitions, values }: Readonly<MetricSummaryProps>) {
  if (definitions.length === 0) return null
  return (
    <Flex wrap gap={spacing.md} style={{ margin: `0 0 ${spacing.lg}px` }}>
      {definitions.map(({ key, label, icon: Icon = AppstoreOutlined, to }) => {
        const card = (
          <Card
            key={key}
            hoverable={!!to}
            style={{ ...cardSurface, ...(to ? { height: '100%' } : { flex: cardFlex }) }}
            styles={{ body: { padding: '20px 22px' } }}
          >
            <Flex justify="space-between" align="flex-start" gap={spacing.sm}>
              <dl style={{ margin: 0, flex: 1, minWidth: 0 }}>
                <dt style={{ color: colors.textMuted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{label}</dt>
                <dd
                  style={{
                    margin: 0,
                    // JetBrains Mono ships at 400 only, so a bold count was faux-bolded; tabular figures keep digits aligned.
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {values[key] ?? '—'}
                </dd>
              </dl>
              <IconTile size={44}>
                <Icon />
              </IconTile>
            </Flex>
            {to && (
              <Flex align="center" gap={6} style={{ marginTop: spacing.sm, color: colors.primary, fontSize: 13, fontWeight: 500 }}>
                Xem và xử lý <ArrowRightOutlined aria-hidden />
              </Flex>
            )}
          </Card>
        )
        return to ? (
          <Link key={key} to={to} aria-label={`${label}: ${values[key] ?? 'chưa có số liệu'}. Xem và xử lý`} style={{ flex: cardFlex, textDecoration: 'none' }}>
            {card}
          </Link>
        ) : (
          card
        )
      })}
    </Flex>
  )
}
