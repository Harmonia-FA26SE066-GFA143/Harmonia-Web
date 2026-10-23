import { CloudOutlined } from '@ant-design/icons'
import { Alert } from 'antd'
import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function getSnapshot() {
  return navigator.onLine
}

/** Persistent connection status for authenticated pages; queries retry when the browser reports reconnection. */
export function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, getSnapshot, () => true)
  if (online) return null

  return (
    <Alert
      type="warning"
      showIcon
      icon={<CloudOutlined />}
      role="status"
      message="Bạn đang ngoại tuyến"
      description="Một số dữ liệu có thể chưa tải được. Ứng dụng sẽ thử lại khi kết nối mạng trở lại."
      style={{ marginBottom: 16 }}
    />
  )
}
