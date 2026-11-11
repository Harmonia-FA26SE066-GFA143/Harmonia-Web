import { CheckCircleOutlined, CloseCircleOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { App, Button, Drawer, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useBackgroundTasks, type BackgroundTask } from '@/shared/tasks/BackgroundTasks'
import { NeumeSpinner } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

const statusText: Record<BackgroundTask['status'], string> = { running: 'Đang chạy', succeeded: 'Đã xong', failed: 'Không thành công' }

function StatusIcon({ status }: Readonly<{ status: BackgroundTask['status'] }>) {
  if (status === 'running') return <NeumeSpinner size={14} />
  if (status === 'succeeded') return <CheckCircleOutlined style={{ color: 'var(--hm-success)' }} />
  return <CloseCircleOutlined style={{ color: colors.error }} />
}

/**
 * The tasks of this tab in the running head: a turning neume and the number running, a list of the session's tasks, and
 * one notification when each finishes, wherever the Director is by then. It never moves the Director back by itself.
 */
export function TaskCenter() {
  const { tasks, retry, dismiss, markNotified } = useBackgroundTasks()
  const { notification } = App.useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const running = tasks.filter((task) => task.status === 'running').length

  const openResult = (to: string, id?: string) => {
    if (id) notification.destroy(id)
    setOpen(false)
    navigate(to)
  }

  useEffect(() => {
    for (const task of tasks) {
      if (task.status === 'running' || task.notified) continue
      markNotified(task.id)
      const { action } = task.result ?? {}
      notification[task.status === 'succeeded' ? 'success' : 'error']({
        key: task.id,
        title: task.title,
        description: task.status === 'succeeded' ? task.result?.summary : task.error,
        duration: 8,
        actions:
          task.status === 'failed' ? (
            <Button
              size="small"
              onClick={() => {
                notification.destroy(task.id)
                retry(task.id)
              }}
            >
              Thử lại
            </Button>
          ) : (
            action && (
              <Button size="small" type="primary" onClick={() => openResult(action.to, task.id)}>
                {action.label}
              </Button>
            )
          ),
      })
    }
    // openResult only closes over stable setters and navigate.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, markNotified, notification, retry])

  if (tasks.length === 0) return null
  return (
    <>
      <Button
        className="hm-chrome-btn"
        type="text"
        aria-label={running ? `${running} tác vụ đang chạy. Mở danh sách tác vụ` : 'Mở danh sách tác vụ'}
        onClick={() => setOpen(true)}
        icon={running ? <NeumeSpinner size={16} /> : <UnorderedListOutlined />}
      >
        {running > 0 && <span aria-hidden>{running}</span>}
      </Button>
      <Drawer title="Tác vụ" open={open} onClose={() => setOpen(false)} size={420}>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          Tác vụ vẫn chạy khi bạn chuyển trang. Tải lại hoặc đóng tab sẽ dừng tác vụ đang chạy.
        </Typography.Paragraph>
        <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {tasks.map((task) => (
            <Flex
              component="li"
              key={task.id}
              vertical
              gap={spacing.xs}
              style={{ padding: spacing.md, border: `1px solid ${colors.border}`, borderRadius: radius.lg }}
            >
              <Flex align="center" gap={spacing.sm}>
                <span aria-hidden style={{ display: 'inline-flex', color: colors.primary }}>
                  <StatusIcon status={task.status} />
                </span>
                <Typography.Text strong style={{ flex: 1, minWidth: 0 }}>
                  {task.title}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: typography.metadata.fontSize }}>
                {statusText[task.status]} · bắt đầu {dayjs(task.startedAt).format('HH:mm')}
              </Typography.Text>
              {task.status === 'succeeded' && task.result && <Typography.Text>{task.result.summary}</Typography.Text>}
              {task.status === 'failed' && <Typography.Text type="danger">{task.error}</Typography.Text>}
              {task.status !== 'running' && (
                <Flex gap={spacing.sm} wrap>
                  {task.status === 'succeeded' && task.result?.action && (
                    <Button size="small" type="primary" onClick={() => openResult(task.result!.action!.to)}>
                      {task.result.action.label}
                    </Button>
                  )}
                  {task.status === 'failed' && (
                    <Button size="small" onClick={() => retry(task.id)}>
                      Thử lại
                    </Button>
                  )}
                  <Button size="small" type="text" onClick={() => dismiss(task.id)}>
                    Bỏ khỏi danh sách
                  </Button>
                </Flex>
              )}
            </Flex>
          ))}
        </Flex>
      </Drawer>
    </>
  )
}
