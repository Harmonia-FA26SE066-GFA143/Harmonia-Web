import { Avatar, Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, gold, spacing, typography } from '@/styles/tokens'
import { formatChatDateLabel } from './chatDateLabel'

export interface ChatHeaderProps {
  partnerName: string
  subtitle?: string
  avatarUrl?: string | null
  /** Live connection indicator (`<output className="notes-live">`) hosted inside the opaque header off WorkspaceGround (G4-03). */
  liveStatus?: ReactNode
  extra?: ReactNode
}

/**
 * Opaque 56px Conversation Header for Notes/Chat (G4-02, G4-03, R2.2).
 */
export function ChatHeader({ partnerName, subtitle, avatarUrl, liveStatus, extra }: Readonly<ChatHeaderProps>) {
  const initial = partnerName.trim().charAt(0).toUpperCase() || '?'
  return (
    <div className="chat-header">
      <Flex align="center" gap={spacing.sm} style={{ minWidth: 0 }}>
        <Avatar
          size={36}
          src={avatarUrl ?? undefined}
          style={{ background: gold.soft, color: colors.textPrimary, flexShrink: 0, fontWeight: 600 }}
        >
          {initial}
        </Avatar>
        <Flex vertical style={{ minWidth: 0, lineHeight: 1.25 }}>
          <Typography.Text strong ellipsis style={{ color: colors.textPrimary }}>
            {partnerName}
          </Typography.Text>
          {subtitle && (
            <Typography.Text ellipsis style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
              {subtitle}
            </Typography.Text>
          )}
        </Flex>
      </Flex>
      <Flex align="center" gap={spacing.sm} style={{ flexShrink: 0 }}>
        {liveStatus}
        {extra}
      </Flex>
    </div>
  )
}

/** Centered ruled date divider between chat message day groups (G4-02). */
export function ChatDateDivider({ date, now }: Readonly<{ date: string; now?: string | number | Date }>) {
  const label = formatChatDateLabel(date, now)
  if (!label) return null
  return (
    <div className="chat-date-divider" role="separator" aria-label={label}>
      <span>{label}</span>
    </div>
  )
}
