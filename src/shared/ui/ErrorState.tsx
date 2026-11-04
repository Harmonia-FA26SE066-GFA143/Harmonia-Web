import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'
import type { ReactNode } from 'react'
import { sections } from '@/styles/tokens'
import { BrokenStaff } from './ChantStaff'
import { StatePanel } from './StatePanel'

const attention = sections.attention

export interface ErrorStateProps {
  title?: ReactNode
  /** User-facing explanation in Vietnamese. Never pass raw technical error messages. */
  description?: ReactNode
  onRetry?: () => void
  /** Shows a loading indicator on the retry button while a retry is in flight. */
  retrying?: boolean
  /** Retains already displayed data after a background refresh fails. */
  hasData?: boolean
  /** Used to distinguish network and server failures without exposing raw error text. */
  error?: unknown
  /** Secondary actions shown after the retry button. */
  extra?: ReactNode
  /** 3 when the panel sits inside a section that has its own level 2 heading. */
  headingLevel?: 2 | 3
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  description,
  onRetry,
  retrying = false,
  hasData = false,
  error,
  extra,
  headingLevel,
}: Readonly<ErrorStateProps>) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  const descriptionText =
    description ??
    (offline || error instanceof TypeError
      ? 'Không có kết nối mạng. Vui lòng kiểm tra kết nối rồi thử lại.'
      : error && typeof error === 'object' && 'status' in error && typeof error.status === 'number' && error.status >= 500
        ? hasData
          ? 'Máy chủ đang gặp sự cố. Dữ liệu hiện có vẫn được giữ; vui lòng thử lại sau.'
          : 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
        : 'Đã xảy ra sự cố khi tải dữ liệu. Vui lòng thử lại.')
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

  if (hasData) {
    // A thin ochre band over the data still shown, with a small broken staff (owner 2026-11-04).
    return (
      <Alert
        type="warning"
        showIcon
        icon={<span style={{ color: attention.cloth }}><BrokenStaff width={36} /></span>}
        role="alert"
        title={offline ? 'Mất kết nối mạng' : 'Không thể cập nhật dữ liệu'}
        description={descriptionText}
        action={onRetry ? <Button size="small" loading={retrying} onClick={onRetry}>Thử lại</Button> : undefined}
        style={{ marginBlock: 12, background: attention.tint, borderColor: attention.border }}
        styles={{ title: { color: attention.ink, fontWeight: 600 }, description: { color: sections.roster.ink } }}
      />
    )
  }

  return (
    <StatePanel
      role="alert"
      tone="danger"
      icon={<BrokenStaff />}
      title={title}
      description={descriptionText}
      actions={actions}
      headingLevel={headingLevel}
    />
  )
}
