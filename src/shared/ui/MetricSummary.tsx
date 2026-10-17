import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { Card, Flex } from 'antd'
import { colors, radius, spacing, typography } from '@/styles/tokens'

export interface MetricSummaryProps {
  definitions: { key: string; label: string }[]
  values: Record<string, number | undefined>
}

function getMetricIcon(key: string) {
  const k = key.toLowerCase()
  if (k.includes('upcoming') || k.includes('event')) return <CalendarOutlined />
  if (k.includes('skill')) return <TrophyOutlined />
  if (k.includes('submission') || k.includes('practice')) return <CustomerServiceOutlined />
  if (k.includes('song') || k.includes('list')) return <FileTextOutlined />
  if (k.includes('member') || k.includes('account') || k.includes('user')) return <TeamOutlined />
  if (k.includes('rehearsal') || k.includes('attendance')) return <CheckCircleOutlined />
  return <AppstoreOutlined />
}

/** Row of summary counts; a missing value shows "—" instead of a guess. Each card is a term and its value (dl). */
export function MetricSummary({ definitions, values }: Readonly<MetricSummaryProps>) {
  if (definitions.length === 0) return null
  return (
    <Flex wrap gap={spacing.md} style={{ margin: `0 0 ${spacing.lg}px` }}>
      {definitions.map((metric) => (
        <Card
          key={metric.key}
          hoverable
          style={{
            flex: '1 1 200px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.02)',
            borderRadius: radius.lg,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
          }}
          styles={{ body: { padding: '20px 22px' } }}
        >
          <Flex justify="space-between" align="flex-start" gap={spacing.sm}>
            <dl style={{ margin: 0, flex: 1, minWidth: 0 }}>
              <dt style={{ color: colors.textMuted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                {metric.label}
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamilyNumeric,
                  fontSize: 32,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: colors.textPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                {values[metric.key] ?? '—'}
              </dd>
            </dl>
            <div
              aria-hidden
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                background: 'rgba(142, 59, 75, 0.08)',
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {getMetricIcon(metric.key)}
            </div>
          </Flex>
        </Card>
      ))}
    </Flex>
  )
}
