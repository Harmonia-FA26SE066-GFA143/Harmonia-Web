import { SendOutlined } from '@ant-design/icons'
import { App, Button, Flex, Input, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { formatDateTime } from '@/lib/api/dates'
import { colors } from '@/styles/tokens'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { useSendMessage, useThread } from '../hooks/useNotes'
import { noteErrorMessage } from '../notesErrors'
import type { DirectorNote } from '../types'

const maxLength = 2000 // SendDirectorNoteMessageRequestValidator

function Bubble({ note, mine }: Readonly<{ note: DirectorNote; mine: boolean }>) {
  const { token } = theme.useToken()
  const about = [note.noteDate && dayjs(note.noteDate).format('DD/MM/YYYY'), note.eventId && (note.eventTitle || 'Sự kiện phụng vụ')]
    .filter(Boolean)
    .join(' · ')
  return (
    <Flex vertical align={mine ? 'flex-end' : 'flex-start'}>
      <div
        style={{
          maxWidth: '75%',
          padding: '8px 12px',
          borderRadius: token.borderRadiusLG,
          background: mine ? token.colorPrimary : token.colorFillTertiary,
          color: mine ? token.colorTextLightSolid : token.colorText,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {about && (
          <div style={{ fontSize: token.fontSizeSM, opacity: 0.85, marginBottom: 4 }}>Ghi chú về {about}</div>
        )}
        {note.content}
      </div>
      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM, fontVariantNumeric: 'tabular-nums' }}>
        {formatDateTime(note.sentAt)}
        {mine && ` · ${note.readAt ? 'Đã xem' : 'Đã gửi'}`}
      </Typography.Text>
    </Flex>
  )
}

/** Messages with one person (oldest at the top, newest at the bottom) and the composer. */
export function ChatThread({ partnerId, partnerName, selfId }: Readonly<{ partnerId: string; partnerName: string; selfId: string }>) {
  const { message } = App.useApp()
  const thread = useThread(partnerId)
  const send = useSendMessage()
  const [draft, setDraft] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  // Pages arrive newest first; the view reads top to bottom, oldest first.
  const notes = (thread.data?.pages.flatMap((page) => page.items) ?? []).toReversed()
  const newest = notes.at(-1)?.id

  // Follow new messages, but not when older ones are prepended by "Xem tin cũ hơn".
  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: 'end' })
  }, [newest, partnerId])

  const submit = () => {
    const content = draft.trim()
    if (!content || send.isPending) return
    send.mutate(
      { toUserId: partnerId, content },
      {
        onSuccess: () => setDraft(''),
        onError: (error) => message.error(noteErrorMessage(error, 'Không thể gửi tin nhắn. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <Flex vertical style={{ height: '100%', minHeight: 0 }}>
      <Flex vertical gap={12} style={{ flex: 1, overflowY: 'auto', padding: 16 }} role="log" aria-label={`Tin nhắn với ${partnerName}`}>
        {thread.isPending && <SectionSkeleton rows={4} label="Đang tải tin nhắn" />}
        {thread.isError && (
          <ErrorState title="Không thể tải tin nhắn" error={thread.error} hasData={thread.data !== undefined} onRetry={() => thread.refetch()} retrying={thread.isFetching} />
        )}
        {thread.hasNextPage && (
          <Button type="link" loading={thread.isFetchingNextPage} onClick={() => thread.fetchNextPage()}>
            Xem tin cũ hơn
          </Button>
        )}
        {thread.data !== undefined && notes.length === 0 && (
          <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
            Chưa có tin nhắn nào với {partnerName}. Hãy bắt đầu cuộc trò chuyện.
          </Typography.Text>
        )}
        {notes.map((note) => (
          <Bubble key={note.id} note={note} mine={note.fromUserId === selfId} />
        ))}
        <div ref={bottom} />
      </Flex>
      <Flex gap={8} align="flex-end" style={{ padding: 12, borderTop: `1px solid ${colors.border}` }}>
        <Input.TextArea
          aria-label={`Nhắn cho ${partnerName}`}
          placeholder="Nhập tin nhắn. Enter để gửi, Shift+Enter để xuống dòng."
          value={draft}
          maxLength={maxLength}
          autoSize={{ minRows: 1, maxRows: 5 }}
          onChange={(event) => setDraft(event.target.value)}
          onPressEnter={(event) => {
            if (event.shiftKey || event.nativeEvent.isComposing) return
            event.preventDefault()
            submit()
          }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={send.isPending} disabled={!draft.trim()} onClick={submit}>
          Gửi
        </Button>
      </Flex>
    </Flex>
  )
}
