import { BellOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Popover, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, radius, sizes, spacing, typography } from '@/styles/tokens'
import { useMarkNotificationRead, useNotificationList, useUnreadNotificationCount } from '../hooks/useNotifications'
import { notificationTitles, type AppNotification } from '../types'

function NotificationItem({ notification, onOpen }: { notification: AppNotification; onOpen: (notification: AppNotification) => void }) {
  const { isRead } = notification
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        style={{
          display: 'flex',
          gap: spacing.sm,
          width: '100%',
          padding: spacing.sm,
          textAlign: 'start',
          background: isRead ? 'transparent' : colors.background,
          border: 0,
          borderRadius: radius.md,
          cursor: isRead ? 'default' : 'pointer',
          font: 'inherit',
        }}
      >
        <Flex vertical style={{ minWidth: 0 }}>
          <Flex gap={spacing.xs} align="center" wrap>
            <Typography.Text strong={!isRead}>
              {notification.type ? notificationTitles[notification.type] : notification.title}
            </Typography.Text>
            {!isRead && (
              <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                Mới
              </Tag>
            )}
          </Flex>
          <Typography.Text style={{ color: colors.textMuted }}>{notification.content}</Typography.Text>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
            {dayjs(parseUtc(notification.createdAt)).format('DD/MM/YYYY HH:mm')}
          </Typography.Text>
        </Flex>
      </button>
    </li>
  )
}

function NotificationList({ open }: { open: boolean }) {
  const list = useNotificationList(open)
  const markRead = useMarkNotificationRead()
  const items = list.data?.pages.flatMap((page) => page.items) ?? []

  if (list.isPending) return <SectionSkeleton rows={3} label="Đang tải thông báo" />
  if (list.isError) return <ErrorState title="Không thể tải thông báo" onRetry={() => list.refetch()} retrying={list.isFetching} />
  if (items.length === 0) {
    return <Typography.Text style={{ color: colors.textMuted }}>Chưa có thông báo nào.</Typography.Text>
  }
  return (
    <Flex vertical gap={spacing.xs}>
      <Flex component="ul" vertical gap={spacing.xs} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onOpen={({ id, isRead }) => !isRead && markRead.mutate(id)}
          />
        ))}
      </Flex>
      {list.hasNextPage && (
        <Button type="link" onClick={() => list.fetchNextPage()} loading={list.isFetchingNextPage}>
          Xem thêm
        </Button>
      )}
    </Flex>
  )
}

/**
 * Header bell of every web workspace: unread count and the latest notifications (Harmonia-BE NotificationsController).
 * Opening an unread notification marks it read; there is no "mark all" endpoint.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unread = useUnreadNotificationCount().data ?? 0

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      title="Thông báo"
      content={
        <div style={{ width: 'min(360px, calc(100vw - 32px))', maxHeight: 420, overflowY: 'auto' }}>
          <NotificationList open={open} />
        </div>
      }
    >
      <Button
        type="text"
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        style={{ width: sizes.touchTarget, height: sizes.touchTarget }}
        icon={
          <Badge count={unread} overflowCount={99} size="small">
            <BellOutlined style={{ fontSize: 20 }} />
          </Badge>
        }
      />
    </Popover>
  )
}
