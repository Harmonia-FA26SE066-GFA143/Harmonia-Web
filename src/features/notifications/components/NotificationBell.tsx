import { BellOutlined } from '@ant-design/icons'
import { App, Badge, Button, Dropdown, Flex, theme, Typography } from 'antd'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDateTime } from '@/lib/api/dates'
import { requestFailureMessage } from '@/lib/api/errors'
import { getSession } from '@/lib/auth/session'
import { ErrorState, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, radius, sizes, spacing, typography } from '@/styles/tokens'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationCount,
} from '../hooks/useNotifications'
import { notificationPath } from '../notificationRoutes'
import type { AppNotification } from '../types'

function NotificationContent({ notification }: Readonly<{ notification: AppNotification }>) {
  const { isRead } = notification
  return (
    <Flex vertical style={{ minWidth: 0 }}>
      <Flex gap={spacing.xs} align="center" wrap>
        <Typography.Text strong={!isRead}>{notification.title}</Typography.Text>
        {!isRead && (
          <StatusTag color="processing" style={{ marginInlineEnd: 0 }}>
            Mới
          </StatusTag>
        )}
      </Flex>
      <Typography.Text style={{ color: colors.textMuted }}>{notification.content}</Typography.Text>
      <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
        {formatDateTime(notification.createdAt)}
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

/**
 * A notification is a button when there is something to do: open the page of its subject, mark it read, or both. A
 * read one about nothing the web shows is not a control.
 */
function NotificationItem({ notification, onOpen }: Readonly<{ notification: AppNotification; onOpen: (notification: AppNotification, path?: string) => void }>) {
  const path = notificationPath(notification, getSession()?.user.roleName)
  return (
    <li>
      {notification.isRead && !path ? (
        <div style={{ ...itemStyle, background: 'transparent' }}>
          <NotificationContent notification={notification} />
        </div>
      ) : (
        <button
          type="button"
          title={path ? 'Bấm để mở' : 'Bấm để đánh dấu đã đọc'}
          onClick={() => onOpen(notification, path)}
          style={{ ...itemStyle, background: notification.isRead ? 'transparent' : colors.background, cursor: 'pointer' }}
        >
          <NotificationContent notification={notification} />
        </button>
      )}
    </li>
  )
}

function NotificationList({ open, onOpen }: Readonly<{ open: boolean; onOpen: (notification: AppNotification, path?: string) => void }>) {
  const list = useNotificationList(open)
  const items = list.data?.pages.flatMap((page) => page.items) ?? []

  if (list.isPending) return <SectionSkeleton rows={3} label="Đang tải thông báo" />
  if (list.isError) return <ErrorState title="Không thể tải thông báo" error={list.error} hasData={list.data !== undefined} onRetry={() => list.refetch()} retrying={list.isFetching} />
  if (items.length === 0) {
    return <Typography.Text style={{ color: colors.textMuted }}>Chưa có thông báo nào.</Typography.Text>
  }
  return (
    <Flex vertical gap={spacing.xs}>
      <Flex component="ul" vertical gap={spacing.xs} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} onOpen={onOpen} />
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
 * Opening a notification marks it read and goes to the page of its subject when the web has one; "mark all" uses `PUT /api/notifications/read-all`.
 *
 * The panel is a Dropdown, not a Popover: the Popover gives its content `role="tooltip"` and puts it at the end of the
 * page, out of the Tab order. Here it is rendered inside a relative wrapper right after the bell, so Tab leads into it,
 * and Escape closes it and gives the focus back to the bell.
 */
export function NotificationBell() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const bell = useRef<HTMLButtonElement>(null)
  const unread = useUnreadNotificationCount().data ?? 0
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  // Opening the subject does not wait for the mark: the page matters more than the badge.
  const handleOpen = (notification: AppNotification, path?: string) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id, { onError: (error) => message.error(requestFailureMessage(error, 'Không thể đánh dấu đã đọc. Vui lòng thử lại.')) })
    }
    if (path) {
      setOpen(false)
      navigate(path)
    }
  }
  const handleMarkAll = () =>
    markAll.mutate(undefined, { onError: (error) => message.error(requestFailureMessage(error, 'Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.')) })

  return (
    <div ref={wrapper} style={{ position: 'relative', display: 'inline-flex' }}>
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={() => wrapper.current ?? document.body}
        popupRender={() => (
          <dialog
            open
            aria-label="Thông báo"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
                bell.current?.focus()
              }
            }}
            style={{
              // Undo the browser's own dialog box (absolute, centred, bordered, padded); the Dropdown places it.
              position: 'static',
              margin: 0,
              padding: 0,
              border: 'none',
              color: 'inherit',
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
              <NotificationList open={open} onOpen={handleOpen} />
            </div>
          </dialog>
        )}
      >
        <Button
          ref={bell}
          className="hm-chrome-btn"
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
