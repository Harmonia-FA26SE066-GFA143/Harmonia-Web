import { Alert } from 'antd'
import dayjs from 'dayjs'
import { parseUtc } from '@/lib/api/dates'
import type { SongList } from '../types'

const at = (value?: string) => (value ? ` lúc ${dayjs(parseUtc(value)).format('HH:mm DD/MM/YYYY')}` : '')

/** Where the newest version stands in the review loop, for the Choir Director (Harmonia-BE `SongListStatus`). */
export function SongListStatusAlert({ list }: Readonly<{ list: SongList }>) {
  const notes = list.reviews.at(-1)?.notes
  const note = notes ? `Nhận xét của Cha xứ: “${notes}”` : undefined
  const version = `Phiên bản ${list.version}`
  switch (list.status) {
    case 'draft':
      return <Alert type="info" showIcon title={`${version} đang là bản nháp, chưa gửi duyệt.`} />
    case 'submitted':
      return (
        <Alert
          type="info"
          showIcon
          title={`${version} đã gửi duyệt${at(list.submittedAt)}. Đang chờ Cha xứ xem xét.`}
          description="Danh sách chỉ xem trong lúc chờ duyệt."
        />
      )
    case 'needsRevision':
      return (
        <Alert
          type="warning"
          showIcon
          title={`Cha xứ yêu cầu chỉnh sửa ${version.toLowerCase()}${at(list.decidedAt)}.`}
          description={[note, 'Lưu thay đổi sẽ tạo phiên bản mới; gửi duyệt khi đã sửa xong.'].filter(Boolean).join(' ')}
        />
      )
    case 'rejected':
      return (
        <Alert
          type="error"
          showIcon
          title={`${version} đã bị từ chối${at(list.decidedAt)}.`}
          description={[note, 'Biên soạn lại rồi lưu để tạo phiên bản mới.'].filter(Boolean).join(' ')}
        />
      )
    case 'approved':
      return (
        <Alert
          type="success"
          showIcon
          title={`${version} đã được phê duyệt${at(list.decidedAt)}.`}
          description={[note, 'Danh sách đã khoá, chỉ xem.'].filter(Boolean).join(' ')}
        />
      )
  }
}
