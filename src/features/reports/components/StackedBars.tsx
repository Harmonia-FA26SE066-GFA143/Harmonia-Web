import { Flex, Tooltip, Typography } from 'antd'
import { colors, radius, spacing } from '@/styles/tokens'
/** One column: a short label under it and a long name for screen readers and tooltips. */
export interface Bucket {
  label: string
  title: string
}

export interface BarSeries<K extends string> {
  key: K
  label: string
  color: string
}

const chartHeight = 160

/**
 * Column chart of counts stacked by series, one column per bucket. Each column names its counts for screen readers;
 * the legend repeats the colors in words.
 */
export function StackedBars<K extends string>({
  buckets,
  values,
  series,
}: Readonly<{ buckets: Bucket[]; values: Record<K, number>[]; series: BarSeries<K>[] }>) {
  const totals = values.map((counts) => series.reduce((sum, { key }) => sum + counts[key], 0))
  const max = Math.max(1, ...totals)

  return (
    <Flex vertical gap={spacing.md}>
      <Flex align="flex-end" gap={spacing.xs} style={{ height: chartHeight + 44, overflowX: 'auto', paddingTop: spacing.sm }}>
        {buckets.map((bucket, index) => {
          const counts = values[index]
          const total = totals[index]
          const description = total
            ? series.filter(({ key }) => counts[key]).map(({ key, label }) => `${counts[key]} ${label.toLowerCase()}`).join(', ')
            : 'không có dữ liệu'
          return (
            <Flex key={bucket.title} vertical align="center" justify="flex-end" style={{ flex: '1 0 28px', height: '100%' }}>
              <Typography.Text style={{ fontSize: 12, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                {total || ''}
              </Typography.Text>
              <Tooltip title={`${bucket.title}: ${description}`}>
                <div
                  role="img"
                  aria-label={`${bucket.title}: ${description}`}
                  style={{
                    width: '100%',
                    maxWidth: 44,
                    height: Math.max(total ? 4 : 2, (total / max) * chartHeight),
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    borderRadius: `${radius.sm}px ${radius.sm}px 0 0`,
                    overflow: 'hidden',
                    background: total ? undefined : colors.border,
                  }}
                >
                  {series.map(({ key, color }) =>
                    counts[key] ? <div key={key} style={{ flex: counts[key], background: color }} /> : null,
                  )}
                </div>
              </Tooltip>
              <Typography.Text aria-hidden style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, whiteSpace: 'nowrap' }}>
                {bucket.label}
              </Typography.Text>
            </Flex>
          )
        })}
      </Flex>
      <Flex wrap gap={spacing.md} component="ul" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {series.map(({ key, label, color }) => (
          <Flex component="li" key={key} align="center" gap={6} style={{ fontSize: 13 }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            {label}
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
