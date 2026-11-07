import { SendOutlined } from '@ant-design/icons'
import { App, Badge, Button, Card, Flex, Tag, Typography, theme } from 'antd'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth/session'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { ChatThread } from '../components/ChatThread'
import { SendNoteDrawer } from '../components/SendNoteDrawer'
import {
  useConversations,
  useDirectorNotesLive,
  useMarkConversationRead,
  useNoteRecipients,
  useSendNote,
} from '../hooks/useNotes'
import { noteErrorMessage } from '../notesErrors'
import type { DirectorNoteValues } from '../types'

interface Contact {
  id: string
  name: string
  unread: number
  preview?: string
}

/**
 * Real-time chat between the Parish Priest and the Choir Directors (FE-23, `/api/director-notes`). The left column
 * lists everyone the caller can write to (recipients plus anyone already talked to), the right one is the thread.
 * The Priest can still send a note about a day or an event; it arrives as a message in the same thread.
 */
function NotesPage({ sender }: Readonly<{ sender: boolean }>) {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const selfId = getSession()?.user.id ?? ''
  const live = useDirectorNotesLive()
  const conversations = useConversations()
  const recipients = useNoteRecipients()
  const markRead = useMarkConversationRead()
  const sendNote = useSendNote()
  const [selectedId, setSelectedId] = useState<string>()
  const [noting, setNoting] = useState(false)

  const byId = new Map<string, Contact>()
  for (const { id, fullName, email } of recipients.data ?? []) byId.set(id, { id, name: fullName || email, unread: 0 })
  for (const { userId, fullName, unreadCount, lastNote } of conversations.data ?? []) {
    byId.set(userId, { id: userId, name: fullName || byId.get(userId)?.name || 'Chưa có họ tên', unread: unreadCount, preview: lastNote.content })
  }
  // Conversations come latest first; recipients without one follow, in the order the backend sent them.
  const order = new Map((conversations.data ?? []).map((row, index) => [row.userId, index]))
  const contacts = [...byId.values()].sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity))
  const selected = contacts.find((contact) => contact.id === selectedId) ?? contacts[0]
  const selectedUnread = selected?.unread ?? 0

  // Opening a conversation, or a message landing in the open one, reads it; the sender sees "Đã xem" at once.
  useEffect(() => {
    if (selected && selectedUnread > 0 && !markRead.isPending) markRead.mutate(selected.id)
  }, [selected?.id, selectedUnread]) // oxlint-disable-line react-hooks/exhaustive-deps -- mutate identity changes every render

  const handleNote = (values: DirectorNoteValues) => {
    if (sendNote.isPending) return
    sendNote.mutate(values, {
      onSuccess: () => {
        message.success('Đã gửi ghi chú. Ca trưởng sẽ nhận được thông báo.')
        setNoting(false)
      },
      onError: (error) => message.error(noteErrorMessage(error, 'Không thể gửi ghi chú. Vui lòng thử lại.')),
    })
  }

  const loading = conversations.isPending || recipients.isPending
  const failed = conversations.isError ? conversations : recipients.isError ? recipients : undefined

  return (
    <>
      <PageHeader
        title={sender ? 'Trao đổi với Ca trưởng' : 'Trao đổi với Cha xứ'}
        breadcrumb={[{ title: sender ? 'Cha xứ' : 'Ca trưởng' }, { title: 'Trao đổi' }]}
        description="Nhắn tin trực tiếp, tin mới hiện ngay không cần tải lại trang."
        extra={
          <Flex gap={8} align="center">
            <Tag color={live ? 'success' : 'warning'}>{live ? 'Đang kết nối' : 'Mất kết nối, đang thử lại'}</Tag>
            {sender && (
              <Button icon={<SendOutlined />} onClick={() => setNoting(true)}>
                Gửi ghi chú theo ngày/sự kiện
              </Button>
            )}
          </Flex>
        }
      />

      {loading && <SectionSkeleton rows={5} label="Đang tải cuộc trò chuyện" />}
      {failed && (
        <ErrorState title="Không thể tải cuộc trò chuyện" error={failed.error!} hasData={false} onRetry={() => { void conversations.refetch(); void recipients.refetch() }} retrying={conversations.isFetching || recipients.isFetching} />
      )}
      {!loading && !failed && contacts.length === 0 && (
        <EmptyState
          title={sender ? 'Chưa có Ca trưởng nào để nhắn' : 'Chưa có Cha xứ nào để nhắn'}
          description="Khi có tài khoản đang hoạt động, bạn sẽ nhắn được tại đây."
        />
      )}
      {!loading && !failed && selected && (
        <Card styles={{ body: { padding: 0, display: 'flex', height: 'min(70vh, 640px)', minHeight: 420 } }}>
          <nav aria-label="Cuộc trò chuyện" style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${token.colorBorderSecondary}` }}>
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                aria-current={contact.id === selected.id}
                onClick={() => setSelectedId(contact.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 0,
                  cursor: 'pointer',
                  color: 'inherit',
                  background: contact.id === selected.id ? token.colorFillTertiary : 'transparent',
                }}
              >
                <Flex justify="space-between" align="center" gap={8}>
                  <Typography.Text strong ellipsis>{contact.name}</Typography.Text>
                  {contact.unread > 0 && <Badge count={contact.unread} aria-label={`${contact.unread} tin chưa đọc`} />}
                </Flex>
                {contact.preview && <Typography.Text type="secondary" ellipsis style={{ display: 'block' }}>{contact.preview}</Typography.Text>}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ChatThread key={selected.id} partnerId={selected.id} partnerName={selected.name} selfId={selfId} />
          </div>
        </Card>
      )}

      {sender && (
        <SendNoteDrawer open={noting} saving={sendNote.isPending} onSubmit={handleNote} onCancel={() => setNoting(false)} />
      )}
    </>
  )
}

export const PriestNotesPage = () => <NotesPage sender />

export const DirectorNotesPage = () => <NotesPage sender={false} />
