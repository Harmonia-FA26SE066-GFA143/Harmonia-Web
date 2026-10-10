import { Flex, Table, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { parseUtc } from '@/lib/api/dates'
import { colors, typography } from '@/styles/tokens'
import type { DirectorNote } from '../types'

export interface NoteTableProps {
  notes: DirectorNote[]
  /** Whose name is shown: the recipient on the Parish Priest's sent notes, the sender on a Choir Director's. */
  party: 'recipient' | 'sender'
  /** Server-side paging of GET /api/director-notes. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
}

const muted = { color: colors.textMuted }
const numeric = { fontFamily: typography.fontFamilyNumeric }

export function NoteTable({ notes, party, page, pageSize, total, loading, onPageChange }: NoteTableProps) {
  const columns: TableColumnsType<DirectorNote> = [
    {
      key: 'party',
      title: party === 'recipient' ? 'Gửi đến' : 'Người gửi',
      render: (_, note) => (
        <Typography.Text strong>{(party === 'recipient' ? note.toUserName : note.fromUserName) || 'Chưa có họ tên'}</Typography.Text>
      ),
    },
    {
      key: 'about',
      title: 'Về',
      render: (_, { noteDate, eventId, eventTitle }) => (
        <Flex vertical>
          {noteDate && <Typography.Text style={numeric}>{dayjs(noteDate).format('DD/MM/YYYY')}</Typography.Text>}
          {eventId && <Typography.Text style={noteDate ? muted : undefined}>{eventTitle || 'Sự kiện phụng vụ'}</Typography.Text>}
        </Flex>
      ),
    },
    {
      key: 'content',
      title: 'Nội dung',
      dataIndex: 'content',
      render: (content: string) => (
        <Typography.Paragraph
          style={{ margin: 0, minWidth: 240, maxWidth: 480, whiteSpace: 'pre-line' }}
          ellipsis={{ rows: 3, expandable: 'collapsible', symbol: (expanded) => (expanded ? 'Thu gọn' : 'Xem thêm') }}
        >
          {content}
        </Typography.Paragraph>
      ),
    },
    {
      key: 'sentAt',
      title: 'Gửi lúc',
      dataIndex: 'sentAt',
      render: (sentAt: string) => <Typography.Text style={numeric}>{dayjs(parseUtc(sentAt)).format('DD/MM/YYYY HH:mm')}</Typography.Text>,
    },
  ]

  return (
    <Table<DirectorNote>
      rowKey="id"
      columns={columns}
      dataSource={notes}
      loading={loading}
      pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: onPageChange }}
      scroll={{ x: 'max-content' }}
    />
  )
}
