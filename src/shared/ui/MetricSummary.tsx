import { AppstoreOutlined } from '@ant-design/icons'
import { Card, Flex } from 'antd'
import type { ComponentType } from 'react'
import { cardSurface, colors, spacing, typography } from '@/styles/tokens'
import { IconTile } from './IconTile'

export interface MetricSummaryProps {
  definitions: { key: string; label: string; icon?: ComponentType }[]
  values: Record<string, number | undefined>
}

/** Row of summary counts; a missing value shows "—" instead of a guess. Each card is a term and its value (dl). */
export function MetricSummary({ definitions, values }: Readonly<MetricSummaryProps>) {
  if (definitions.length === 0) return null
  return (
    <Flex wrap gap={spacing.md} style={{ margin: `0 0 ${spacing.lg}px` }}>
      {definitions.map(({ key, label, icon: Icon = AppstoreOutlined }) => (
        <Card key={key} hoverable style={{ ...cardSurface, flex: '1 1 200px' }} styles={{ body: { padding: '20px 22px' } }}>
          <Flex justify="space-between" align="flex-start" gap={spacing.sm}>
            <dl style={{ margin: 0, flex: 1, minWidth: 0 }}>
              <dt style={{ color: colors.textMuted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{label}</dt>
              <dd
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamilyNumeric,
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
        </Card>
      ))}
    </Flex>
  )
}
