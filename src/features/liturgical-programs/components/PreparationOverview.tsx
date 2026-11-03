import { CheckOutlined, ClockCircleOutlined, EllipsisOutlined, MinusOutlined } from '@ant-design/icons'
import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, radius, sections, spacing, typography } from '@/styles/tokens'
import type { PreparationItem, PreparationState } from '../preparationOverview'

export interface PreparationOverviewProps {
  items: PreparationItem[]
}

const appearance: Record<PreparationState, { icon: ReactNode; tone: string; background: string; border: string }> = {
  done: { icon: <CheckOutlined />, tone: colors.primary, background: colors.primarySoft, border: sections.liturgy.border },
  progress: { icon: <EllipsisOutlined />, tone: colors.textBody, background: colors.softSurface, border: colors.mutedBorder },
  waiting: { icon: <ClockCircleOutlined />, tone: sections.attention.ink, background: sections.attention.tint, border: sections.attention.border },
  todo: { icon: <MinusOutlined />, tone: colors.textMuted, background: colors.surface, border: colors.border },
}

/**
 * Preparation is shown as independent items, without numbering, connectors or a "current step". This keeps the UI
 * truthful when, for example, the celebration date has passed but participation or roster work is still incomplete.
 */
export function PreparationOverview({ items }: Readonly<PreparationOverviewProps>) {
  const done = items.filter((item) => item.state === 'done').length

  return (
    <Flex vertical gap={spacing.md}>
      <Typography.Text role="status" aria-atomic>
        Đã hoàn tất <strong>{done}/{items.length}</strong> mục. Các mục được cập nhật độc lập.
      </Typography.Text>
      <ul
        aria-label="Tình trạng các mục chuẩn bị"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: spacing.sm,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {items.map((item) => {
          const style = appearance[item.state]
          return (
            <li
              key={item.label}
              style={{
                minWidth: 0,
                padding: `${spacing.sm}px ${spacing.md}px`,
                border: `1px solid ${style.border}`,
                borderInlineStart: `3px solid ${style.tone}`,
                borderRadius: radius.md,
                background: style.background,
              }}
            >
              <Flex align="flex-start" gap={spacing.sm}>
                <span aria-hidden style={{ display: 'inline-flex', marginTop: 3, color: style.tone }}>
                  {style.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <Typography.Text style={{ display: 'block', color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                    {item.label}
                  </Typography.Text>
                  <Typography.Text style={{ display: 'block', fontWeight: 600, color: style.tone }}>
                    {item.value}
                  </Typography.Text>
                  {item.note && (
                    <Typography.Text style={{ display: 'block', color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                      {item.note}
                    </Typography.Text>
                  )}
                </div>
              </Flex>
            </li>
          )
        })}
      </ul>
    </Flex>
  )
}
