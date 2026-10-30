import { ArrowRightOutlined } from '@ant-design/icons'
import { Card } from 'antd'
import { Link } from 'react-router'
import { cardSurface, colors, sections } from '@/styles/tokens'

export interface MetricSummaryProps {
  /**
   * `to` adds a link to the page where the counted items are handled. `attention` marks a count of things waiting on
   * the viewer: above zero it turns amber, at zero it stays grey like the others.
   */
  definitions: { key: string; label: string; to?: string; attention?: boolean }[]
  values: Record<string, number | undefined>
}

/**
 * Summary counts in one card, split into equal columns by 1px rules: a grey label over the figure, no icons. A missing
 * value shows "—" instead of a guess. The cells are the terms and values of one list (dl).
 */
export function MetricSummary({ definitions, values }: Readonly<MetricSummaryProps>) {
  if (definitions.length === 0) return null
  return (
    <Card style={{ ...cardSurface, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
      <dl style={{ display: 'grid', gridTemplateColumns: `repeat(${definitions.length}, minmax(0, 1fr))`, margin: 0 }}>
        {definitions.map(({ key, label, to, attention }, index) => {
          // The attention bookcloth: its ink is 7:1 on its tint.
          const waiting = attention && (values[key] ?? 0) > 0
          return (
            <div
              key={key}
              style={{
                padding: '16px 20px',
                borderInlineStart: index > 0 ? `1px solid ${colors.border}` : undefined,
                background: waiting ? sections.attention.tint : undefined,
              }}
            >
              <dt style={{ color: waiting ? sections.attention.ink : colors.textMuted, fontSize: 13, fontWeight: 500 }}>{label}</dt>
              <dd
                style={{
                  margin: '4px 0 0',
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  fontVariantNumeric: 'tabular-nums',
                  color: waiting ? sections.attention.ink : undefined,
                }}
              >
                {values[key] ?? '—'}
              </dd>
              {to && (
                <dd style={{ margin: '4px 0 0', fontSize: 13 }}>
                  <Link to={to} aria-label={`${label}: ${values[key] ?? 'chưa có số liệu'}. Xem`} style={{ fontWeight: 500 }}>
                    Xem <ArrowRightOutlined aria-hidden />
                  </Link>
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </Card>
  )
}
