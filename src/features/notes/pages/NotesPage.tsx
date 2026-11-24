import { Alert, App, Badge, Button, Card, Flex, Typography } from 'antd'
import { spacing } from '@/styles/tokens'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth/session'
import { EmptyState, ErrorState, Icon, PageHeader, SectionSkeleton } from '@/shared/ui'
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

  // Blocks only when neither list arrived; one failing beside the other still leaves people to write to.
  const failedQuery = conversations.isError ? conversations : recipients.isError ? recipients : undefined
  const loading = conversations.isPending || recipients.isPending
  const failed = !loading && !conversations.data && !recipients.data ? failedQuery : undefined
  const partial = !loading && failedQuery !== undefined && failed === undefined

  return (
    <>
      <PageHeader
        title={sender ? 'Trao đổi với Ca trưởng' : 'Trao đổi với Cha xứ'}
        breadcrumb={[{ title: sender ? 'Cha xứ' : 'Ca trưởng' }, { title: 'Trao đổi' }]}
        description="Nhắn tin trực tiếp, tin mới hiện ngay không cần tải lại trang."
        extra={
          sender && (
            <Button icon={<Icon name="send" />} onClick={() => setNoting(true)}>
              Gửi ghi chú theo ngày/sự kiện
            </Button>
          )
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
      {partial && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: spacing.md }}
          title={
            conversations.isError
              ? 'Không tải được các cuộc trò chuyện cũ; danh sách có thể chưa đầy đủ.'
              : 'Không tải được danh sách người nhận; chỉ hiện những người đã trò chuyện.'
          }
          action={
            <Button size="small" onClick={() => void failedQuery?.refetch()} loading={failedQuery?.isFetching}>
              Thử lại
            </Button>
          }
        />
      )}
      {!loading && !failed && selected && (
        <Card
          className="notes-shell-card"
          styles={{ body: { padding: 0, display: 'flex', height: 'clamp(420px, calc(100vh - 260px), 680px)' } }}
        >
          <nav aria-labelledby="notes-people-heading" className="notes-people hm-paper">
            <h2 id="notes-people-heading" className="hm-rubric">
              Cuộc trò chuyện
            </h2>
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                className="notes-person"
                aria-current={contact.id === selected.id}
                onClick={() => setSelectedId(contact.id)}
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
            <ChatThread
              key={selected.id}
              partnerId={selected.id}
              partnerName={selected.name}
              partnerSubtitle={sender ? 'Ca trưởng' : 'Cha xứ'}
              selfId={selfId}
              liveStatus={
                // The state in words; the dot only echoes it. Inside the opaque chat header (G4-03).
                <output className={`notes-live${live ? ' is-live' : ''}`}>
                  {live ? 'Đã kết nối' : 'Mất kết nối, đang thử lại'}
                </output>
              }
            />
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
