import { BellOutlined } from '@ant-design/icons'
import { App, Badge, Button, Dropdown, Flex, theme, Typography } from 'antd'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { ErrorState, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, radius, sizes, spacing, typography } from '@/styles/tokens'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationCount,
} from '../hooks/useNotifications'
import { notificationTitles, type AppNotification } from '../types'

function NotificationContent({ notification }: Readonly<{ notification: AppNotification }>) {
  const { isRead } = notification
  return (
    <Flex vertical style={{ minWidth: 0 }}>
      <Flex gap={spacing.xs} align="center" wrap>
        <Typography.Text strong={!isRead}>
          {notification.type ? notificationTitles[notification.type] : notification.title}
        </Typography.Text>
        {!isRead && (
          <StatusTag color="processing" style={{ marginInlineEnd: 0 }}>
            Mới
          </StatusTag>
        )}
      </Flex>
      <Typography.Text style={{ color: colors.textMuted }}>{notification.content}</Typography.Text>
      <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
        {dayjs(parseUtc(notification.createdAt)).format('DD/MM/YYYY HH:mm')}
      </Typography.Text>
    </Flex>
  )
}

const itemStyle = {
  display: 'flex',
  gap: spacing.sm,
  width: '100%',
  padding: spacing.sm,
  textAlign: 'start',
  border: 0,
  borderRadius: radius.md,
  font: 'inherit',
} as const

/** An unread notification is a button that marks it read; a read one has nothing to do, so it is not a control. */
function NotificationItem({ notification, onMarkRead }: Readonly<{ notification: AppNotification; onMarkRead: (id: string) => void }>) {
  return (
    <li>
      {notification.isRead ? (
        <div style={{ ...itemStyle, background: 'transparent' }}>
          <NotificationContent notification={notification} />
        </div>
      ) : (
        <button
          type="button"
          title="Bấm để đánh dấu đã đọc"
          onClick={() => onMarkRead(notification.id)}
          style={{ ...itemStyle, background: colors.background, cursor: 'pointer' }}
        >
          <NotificationContent notification={notification} />
        </button>
      )}
    </li>
  )
}

function NotificationList({ open, onMarkRead }: Readonly<{ open: boolean; onMarkRead: (id: string) => void }>) {
  const list = useNotificationList(open)
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
          <NotificationItem key={notification.id} notification={notification} onMarkRead={onMarkRead} />
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
 * Opening an unread notification marks it read; "mark all" uses `PUT /api/notifications/read-all`.
 *
 * The panel is a Dropdown, not a Popover: the Popover gives its content `role="tooltip"` and puts it at the end of the
 * page, out of the Tab order. Here it is rendered inside a relative wrapper right after the bell, so Tab leads into it,
 * and Escape closes it and gives the focus back to the bell.
 */
export function NotificationBell() {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const bell = useRef<HTMLButtonElement>(null)
  const unread = useUnreadNotificationCount().data ?? 0
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const handleMarkRead = (id: string) =>
    markRead.mutate(id, { onError: () => message.error('Không thể đánh dấu đã đọc. Vui lòng thử lại.') })
  const handleMarkAll = () =>
    markAll.mutate(undefined, { onError: () => message.error('Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.') })

  return (
    <div
      ref={wrapper}
      style={{ position: 'relative', display: 'inline-flex' }}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          setOpen(false)
          bell.current?.focus()
        }
      }}
    >
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={() => wrapper.current ?? document.body}
        popupRender={() => (
          <div
            role="dialog"
            aria-label="Thông báo"
            style={{
              width: 'min(360px, calc(100vw - 32px))',
              background: token.colorBgElevated,
              borderRadius: token.borderRadiusLG,
              boxShadow: token.boxShadowSecondary,
            }}
          >
            <Flex
              align="center"
              justify="space-between"
              gap={spacing.sm}
              style={{ padding: `${spacing.sm}px ${spacing.md}px`, borderBottom: `1px solid ${colors.border}` }}
            >
              <Typography.Text strong>Thông báo</Typography.Text>
              {unread > 0 && (
                <Button type="link" size="small" loading={markAll.isPending} onClick={handleMarkAll}>
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </Flex>
            <div style={{ padding: spacing.sm, maxHeight: 420, overflowY: 'auto' }}>
              <NotificationList open={open} onMarkRead={handleMarkRead} />
            </div>
          </div>
        )}
      >
        <Button
          ref={bell}
          type="text"
          aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
          aria-haspopup="dialog"
          aria-expanded={open}
          style={{ width: sizes.touchTarget, height: sizes.touchTarget }}
          icon={
            <Badge count={unread} overflowCount={99} size="small">
              <BellOutlined style={{ fontSize: 20 }} />
            </Badge>
          }
        />
      </Dropdown>
    </div>
  )
}
