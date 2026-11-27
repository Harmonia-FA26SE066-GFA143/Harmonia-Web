import { App, Badge, Button, Dropdown, Flex, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDateTime } from '@/lib/api/dates'
import { requestFailureMessage } from '@/lib/api/errors'
import { getSession } from '@/lib/auth/session'
import { ErrorState, Icon, NeumeSpinner, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, sizes, spacing } from '@/styles/tokens'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
  useUnreadNotificationCount,
} from '../hooks/useNotifications'
import { notificationPath, resolveNotificationPath } from '../notificationRoutes'
import type { AppNotification } from '../types'

function NotificationContent({
  notification,
  navigable,
  opening,
}: Readonly<{ notification: AppNotification; navigable: boolean; opening: boolean }>) {
  const { isRead } = notification
  return (
    <>
      <Flex vertical gap={2} style={{ minWidth: 0, flex: 1 }}>
        <Flex gap={spacing.xs} align="center" wrap>
          <Typography.Text strong={!isRead} style={{ color: colors.textPrimary }}>
            {notification.title}
          </Typography.Text>
          {!isRead && (
            <StatusTag color="gold" style={{ marginInlineEnd: 0 }}>
              Mới
            </StatusTag>
          )}
        </Flex>
        <Typography.Text className="hm-notif-content">{notification.content}</Typography.Text>
        <Typography.Text className="hm-notif-time">{formatDateTime(notification.createdAt)}</Typography.Text>
      </Flex>
      {(opening || navigable) && (
        <span className="hm-notif-chevron" aria-hidden>
          {opening ? <NeumeSpinner size={14} /> : <Icon name="chevron-right" size="xs" />}
        </span>
      )}
    </>
  )
}

/**
 * A notification is a button when there is something to do: open the page of its subject, mark it read, or both. A
 * read one about nothing the web shows is not a control.
 */
function NotificationItem({
  notification,
  opening,
  onOpen,
}: Readonly<{
  notification: AppNotification
  opening: boolean
  onOpen: (notification: AppNotification, path?: string) => void
}>) {
  const path = notificationPath(notification, getSession()?.user.roleName)
  const itemClass = `hm-notif-item${notification.isRead ? '' : ' is-unread'}`
  return (
    <li>
      {notification.isRead && !path ? (
        <div className={itemClass}>
          <NotificationContent notification={notification} navigable={false} opening={false} />
        </div>
      ) : (
        <button
          type="button"
          className={`${itemClass} is-actionable`}
          disabled={opening}
          title={path ? 'Bấm để mở' : 'Bấm để đánh dấu đã đọc'}
          onClick={() => onOpen(notification, path)}
        >
          <NotificationContent notification={notification} navigable={Boolean(path)} opening={opening} />
        </button>
      )}
    </li>
  )
}

function NotificationList({
  open,
  openingId,
  onOpen,
}: Readonly<{
  open: boolean
  openingId?: string
  onOpen: (notification: AppNotification, path?: string) => void
}>) {
  const list = useNotificationList(open)
  const items = list.data?.pages.flatMap((page) => page.items) ?? []

  if (list.isPending) {
    return (
      <div className="hm-notif-state">
        <SectionSkeleton rows={3} label="Đang tải thông báo" />
      </div>
    )
  }
  if (list.isError) {
    return (
      <div className="hm-notif-state">
        <ErrorState
          headingLevel={3}
          title="Không thể tải thông báo"
          error={list.error}
          hasData={list.data !== undefined}
          onRetry={() => list.refetch()}
          retrying={list.isFetching}
        />
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="hm-notif-empty">
        <Icon name="notification" size="lg" />
        <Typography.Text style={{ color: colors.textMuted }}>Chưa có thông báo nào.</Typography.Text>
      </div>
    )
  }
  return (
    <Flex vertical gap={spacing.xs}>
      <ul className="hm-notif-list">
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            opening={openingId === notification.id}
            onOpen={onOpen}
          />
        ))}
      </ul>
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
  const [open, setOpen] = useState(false)
  const [openingId, setOpeningId] = useState<string>()
  const openToken = useRef(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const bell = useRef<HTMLButtonElement>(null)
  const unread = useUnreadNotificationCount().data ?? 0
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  useEffect(() => {
    const token = openToken
    return () => {
      token.current += 1
    }
  }, [])

  const closePanel = () => {
    openToken.current += 1
    setOpeningId(undefined)
    setOpen(false)
  }

  // Opening the subject does not wait for the mark: the page matters more than the badge.
  const handleOpen = (notification: AppNotification, path?: string) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id, { onError: (error) => message.error(requestFailureMessage(error, 'Không thể đánh dấu đã đọc. Vui lòng thử lại.')) })
    }
    if (!path) return
    const needsLookup = notification.referenceType === 'SongList' && Boolean(notification.referenceId)
    if (!needsLookup) {
      closePanel()
      navigate(path)
      return
    }
    const token = ++openToken.current
    setOpeningId(notification.id)
    void resolveNotificationPath(notification, getSession()?.user.roleName).then((resolved) => {
      if (openToken.current !== token) return
      setOpeningId(undefined)
      setOpen(false)
      navigate(resolved ?? path)
    })
  }
  const handleMarkAll = () =>
    markAll.mutate(undefined, { onError: (error) => message.error(requestFailureMessage(error, 'Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.')) })

  return (
    <div ref={wrapper} style={{ position: 'relative', display: 'inline-flex' }}>
      <Dropdown
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true)
          else closePanel()
        }}
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={() => wrapper.current ?? document.body}
        popupRender={() => (
          <dialog
            open
            aria-label="Thông báo"
            className="hm-notif-dialog"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                closePanel()
                bell.current?.focus()
              }
            }}
          >
            <Flex align="center" justify="space-between" gap={spacing.sm} className="hm-notif-head">
              <Typography.Text strong>
                Thông báo{unread > 0 ? ` (${unread})` : ''}
              </Typography.Text>
              {unread > 0 && (
                <Button type="link" size="small" loading={markAll.isPending} onClick={handleMarkAll}>
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </Flex>
            <div className="hm-notif-body">
              <NotificationList open={open} openingId={openingId} onOpen={handleOpen} />
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
            <Badge className="hm-notif-badge" count={unread} overflowCount={99} size="small">
              <Icon name="notification" size={20} />
            </Badge>
          }
        />
      </Dropdown>
    </div>
  )
}
