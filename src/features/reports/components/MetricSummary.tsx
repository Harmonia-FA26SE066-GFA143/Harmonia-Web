import { Card, Flex, Typography } from 'antd'
import { colors, spacing, typography } from '@/styles/tokens'
import type { ReportMetricDefinition } from '../reportDefinitions'

export interface MetricSummaryProps {
  definitions: ReportMetricDefinition[]
  values: Record<string, number | undefined>
}

/** Summary counts exactly as returned by the backend; a missing value shows "—" instead of a guess. */
export function MetricSummary({ definitions, values }: MetricSummaryProps) {
  if (definitions.length === 0) return null
  return (
    <Flex component="dl" wrap gap={spacing.md} style={{ margin: `0 0 ${spacing.md}px` }}>
      {definitions.map((metric) => (
        <Card key={metric.key} style={{ flex: '1 1 160px' }} styles={{ body: { padding: spacing.md } }}>
          <Typography.Text component="dt" style={{ color: colors.textMuted }}>
            {metric.label}
          </Typography.Text>
          <dd
            style={{
              margin: `${spacing.xs}px 0 0`,
              fontFamily: typography.fontFamilyNumeric,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
              color: colors.textPrimary,
            }}
          >
            {values[metric.key] ?? '—'}
          </dd>
        </Card>
      ))}
    </Flex>
  )
}
