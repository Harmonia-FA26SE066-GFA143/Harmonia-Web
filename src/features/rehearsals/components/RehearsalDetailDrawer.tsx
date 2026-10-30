import { Button, Drawer, Flex, List, Typography } from 'antd'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { formatRehearsalTime } from '../rehearsalFormat'
import { isRehearsalDay, isUpcoming, type Rehearsal } from '../types'

interface RehearsalDetailDrawerProps {
  rehearsal?: Rehearsal
  program?: LiturgicalProgram
  onClose: () => void
  onAttendance: (rehearsal: Rehearsal) => void
  onEdit: (rehearsal: Rehearsal) => void
  onDelete: (rehearsal: Rehearsal) => void
}

export function RehearsalDetailDrawer({ rehearsal, program, onClose, onAttendance, onEdit, onDelete }: Readonly<RehearsalDetailDrawerProps>) {
  if (!rehearsal) return null
  const programLink = rehearsal.eventId ? generatePath(paths.director.programDetail, { programId: rehearsal.eventId }) : undefined
  return (
    <Drawer title="Chi tiết buổi tập" open onClose={onClose} size={520} destroyOnHidden>
      <Flex vertical gap={16}>
        <div>
          <Typography.Text type="secondary">Thời gian</Typography.Text>
          <Typography.Paragraph strong style={{ marginBottom: 0 }}>{formatRehearsalTime(rehearsal)}</Typography.Paragraph>
        </div>
        {rehearsal.locationName && (
          <div><Typography.Text type="secondary">Địa điểm</Typography.Text><Typography.Paragraph style={{ marginBottom: 0 }}>{rehearsal.locationName}</Typography.Paragraph></div>
        )}
        {programLink && (
          <div><Typography.Text type="secondary">Chương trình phụng vụ</Typography.Text><div>{program ? <Link to={programLink}>{program.eventName} · {formatProgramDate(program.date)}</Link> : <Link to={programLink}>Xem chương trình</Link>}</div></div>
        )}
        {rehearsal.note && <div><Typography.Text type="secondary">Ghi chú</Typography.Text><Typography.Paragraph style={{ marginBottom: 0 }}>{rehearsal.note}</Typography.Paragraph></div>}
        <div>
          <Typography.Text type="secondary">Bài hát · {rehearsal.songs.length}</Typography.Text>
          {rehearsal.songs.length ? <List size="small" dataSource={rehearsal.songs} renderItem={(song) => <List.Item>{song.songTitle}</List.Item>} /> : <Typography.Paragraph style={{ marginBottom: 0 }}>Chưa có bài hát</Typography.Paragraph>}
        </div>
        <Flex wrap gap={8}>
          <Button type="primary" onClick={() => onAttendance(rehearsal)}>{isRehearsalDay(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'}</Button>
          {isUpcoming(rehearsal) && <Button onClick={() => onEdit(rehearsal)}>Sửa</Button>}
          <Button danger onClick={() => onDelete(rehearsal)}>Xóa</Button>
        </Flex>
      </Flex>
    </Drawer>
  )
}
