import { Alert } from 'antd'
import { useChoirs } from '../hooks/useChoirs'

/**
 * Choir Director: says that no choir is theirs yet. A director reads only the events of the choirs they direct
 * (ChoirScopeService), so without this the empty pages look as if nothing had been published.
 */
export function NoChoirNotice() {
  const choirs = useChoirs()
  if (choirs.data?.length !== 0) return null
  return (
    <Alert
      type="warning"
      showIcon
      title="Bạn chưa phụ trách ca đoàn nào"
      description="Chương trình, buổi tập và bài tập chỉ hiện khi bạn phụ trách một ca đoàn. Quản trị viên chọn ca trưởng cho ca đoàn ở trang Ca đoàn."
      style={{ marginBottom: 16 }}
    />
  )
}
