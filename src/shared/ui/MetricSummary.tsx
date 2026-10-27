import { ArrowRightOutlined } from '@ant-design/icons'
import { Card } from 'antd'
import { Link } from 'react-router'
import { cardSurface, colors } from '@/styles/tokens'

export interface MetricSummaryProps {
  /** `to` adds a link to the page where the counted items are handled. */
  definitions: { key: string; label: string; to?: string }[]
  values: Record<string, number | undefined>
}

/**
 * Summary counts in one card, split into equal columns by 1px rules: a grey label over the figure, no icons. A missing
 * value shows "—" instead of a guess. The cells are the terms and values of one list (dl).
 */
export function MetricSummary({ definitions, values }: Readonly<MetricSummaryProps>) {
  if (definitions.length === 0) return null
  return (
    <Card style={cardSurface} styles={{ body: { padding: 0 } }}>
      <dl style={{ display: 'grid', gridTemplateColumns: `repeat(${definitions.length}, minmax(0, 1fr))`, margin: 0 }}>
        {definitions.map(({ key, label, to }, index) => (
          <div
            key={key}
            style={{ padding: '16px 20px', borderInlineStart: index > 0 ? `1px solid ${colors.border}` : undefined }}
          >
            <dt style={{ color: colors.textMuted, fontSize: 13, fontWeight: 500 }}>{label}</dt>
            <dd style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 600, lineHeight: 1.25, fontVariantNumeric: 'tabular-nums' }}>
              {values[key] ?? '—'}
            </dd>
            {to && (
              <dd style={{ margin: '4px 0 0', fontSize: 13 }}>
                <Link to={to} aria-label={`${label}: ${values[key] ?? 'chưa có số liệu'}. Xem và xử lý`} style={{ fontWeight: 500 }}>
                  Xem và xử lý <ArrowRightOutlined aria-hidden />
                </Link>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </Card>
  )
}
