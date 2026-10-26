import { Alert } from 'antd'
import { useEventChoirs } from '../hooks/useChoirs'
import { isPlanningDirector } from '../leadChoir'

/**
 * Choir Director: tells a director whose choir serves the program but does not lead it that the song list,
 * invitations and roster are the lead choir's (D8, 403 CHOIR_NOT_LEAD otherwise). Nothing while it is still loading.
 */
export function LeadChoirNotice({ eventId }: Readonly<{ eventId: string }>) {
  const serving = useEventChoirs(eventId)
  if (!serving.data || isPlanningDirector(serving.data)) return null
  const lead = serving.data.find((choir) => choir.isLead)
  return (
    <Alert
      type="info"
      showIcon
      title={`${lead?.name ?? 'Ca đoàn khác'} phụ trách chương trình này`}
      description="Bạn xem được danh sách bài, xác nhận tham gia và phân công; chỉ ca trưởng của ca đoàn phụ trách được lập và sửa."
    />
  )
}
