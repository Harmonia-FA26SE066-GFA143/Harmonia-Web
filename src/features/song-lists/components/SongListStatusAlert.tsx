import { Alert } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { SongList } from '../types'

const at = (iso?: string) => (iso ? ` lúc ${dayjs(iso).format('HH:mm DD/MM/YYYY')}` : '')

/**
 * Where the list stands in the review loop, from the point of view of `viewer`. Statuses follow Harmonia-BE
 * `SongListStatus`; the wording explains the editing lock decided on 2026-09-28.
 */
export function SongListStatusAlert({ list, viewer, action }: { list: SongList; viewer: 'director' | 'priest'; action?: ReactNode }) {
  const note = list.priestNote ? `Ghi chú của Cha xứ / Ban phụng vụ: “${list.priestNote}”` : undefined
  switch (list.status) {
    case 'draft':
      return viewer === 'director' ? (
        <Alert type="info" showIcon title="Danh sách đang là bản nháp, chưa gửi duyệt." action={action} />
      ) : null
    case 'submitted':
      return (
        <Alert
          type="info"
          showIcon
          title={viewer === 'director' ? `Đã gửi duyệt${at(list.submittedAt)}. Đang chờ Cha xứ / Ban phụng vụ xem xét.` : `Ca trưởng đã gửi danh sách${at(list.submittedAt)}.`}
          description={viewer === 'director' ? 'Danh sách chỉ xem trong lúc chờ duyệt.' : 'Xem xét từng bài hát rồi gửi quyết định.'}
        />
      )
    case 'needsRevision':
      return (
        <Alert
          type="warning"
          showIcon
          title={`Cha xứ / Ban phụng vụ yêu cầu chỉnh sửa${at(list.reviewedAt)}.`}
          description={[note, viewer === 'director' ? 'Sửa các bài được đánh dấu “Cần chỉnh sửa” rồi gửi duyệt lại.' : 'Đang chờ Ca trưởng cập nhật và gửi lại.'].filter(Boolean).join(' ')}
          action={action}
        />
      )
    case 'rejected':
      return (
        <Alert
          type="error"
          showIcon
          title={`Danh sách đã bị từ chối${at(list.reviewedAt)}.`}
          description={[note, viewer === 'director' ? 'Biên soạn lại danh sách rồi gửi duyệt lần mới.' : 'Đang chờ Ca trưởng biên soạn lại.'].filter(Boolean).join(' ')}
          action={action}
        />
      )
    case 'approved':
      return (
        <Alert
          type="success"
          showIcon
          title={`Danh sách đã được phê duyệt${at(list.reviewedAt)}.`}
          description={[note, viewer === 'director' ? 'Danh sách đã khoá, chỉ xem.' : undefined].filter(Boolean).join(' ') || undefined}
        />
      )
    default:
      return null
  }
}
