import { DisconnectOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ReactNode } from 'react'
import { StatePanel } from './StatePanel'

export interface ErrorStateProps {
  title?: ReactNode
  /** User-facing explanation in Vietnamese. Never pass raw technical error messages. */
  description?: ReactNode
  onRetry?: () => void
  /** Shows a loading indicator on the retry button while a retry is in flight. */
  retrying?: boolean
  /** Secondary actions shown after the retry button. */
  extra?: ReactNode
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  description = 'Đã xảy ra sự cố khi tải dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.',
  onRetry,
  retrying = false,
  extra,
}: ErrorStateProps) {
  const actions =
    onRetry || extra ? (
      <>
        {onRetry && (
          <Button type="primary" icon={<ReloadOutlined />} loading={retrying} onClick={onRetry}>
            Thử lại
          </Button>
        )}
        {extra}
      </>
    ) : undefined

  return (
    <StatePanel
      role="alert"
      tone="danger"
      icon={<DisconnectOutlined />}
      title={title}
      description={description}
      actions={actions}
    />
  )
}
