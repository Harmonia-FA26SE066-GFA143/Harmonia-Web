import { App, Button, Flex, Input, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { generatePath, Link } from 'react-router'
import { formatDateTime, parseUtc } from '@/lib/api/dates'
import { colors } from '@/styles/tokens'
import { ChatDateDivider, ChatHeader, ErrorState, Icon, PROGRAM_NOUN, SectionSkeleton, visuallyHidden } from '@/shared/ui'
import { useSendMessage, useThread } from '../hooks/useNotes'
import { noteErrorMessage } from '../notesErrors'
import type { DirectorNote } from '../types'

const maxLength = 2000 // SendDirectorNoteMessageRequestValidator

function Bubble({ note, mine, eventPathTemplate }: Readonly<{ note: DirectorNote; mine: boolean; eventPathTemplate?: string }>) {
  const { token } = theme.useToken()
  const noteDate = note.noteDate ? dayjs(note.noteDate).format('DD/MM/YYYY') : undefined
  const eventLabel = note.eventId ? (note.eventTitle || PROGRAM_NOUN) : undefined
  const eventHref = note.eventId && eventPathTemplate ? generatePath(eventPathTemplate, { programId: note.eventId }) : undefined
  const sentTime = dayjs(parseUtc(note.sentAt)).format('HH:mm')
  const fullSentAt = formatDateTime(note.sentAt)
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
        {(noteDate || eventLabel) && (
          <div
            style={{
              fontSize: token.fontSizeSM,
              fontWeight: 600,
              opacity: 0.9,
              borderBottom: '1px solid currentColor',
              paddingBottom: 4,
              marginBottom: 6,
            }}
          >
            Ghi chú về {noteDate}
            {noteDate && eventLabel ? ' · ' : ''}
            {eventLabel && eventHref ? (
              <Link to={eventHref} style={{ color: 'inherit', textDecoration: 'underline' }}>
                {eventLabel}
              </Link>
            ) : (
              eventLabel
            )}
          </div>
        )}
        {note.content}
      </div>
      <Typography.Text type="secondary" title={fullSentAt} style={{ fontSize: token.fontSizeSM }}>
        {sentTime}
        {mine && ` · ${note.readAt ? 'Đã xem' : 'Đã gửi'}`}
      </Typography.Text>
    </Flex>
  )
}

const localDay = (sentAt: string) => dayjs(parseUtc(sentAt)).format('YYYY-MM-DD')

export interface ChatThreadProps {
  partnerId: string
  partnerName: string
  partnerSubtitle?: string
  selfId: string
  /** Preserves an unsent draft across partner switches when managed by the parent. */
  draft?: string
  onDraftChange?: (value: string) => void
  /** Route template with `:programId` so event notes link straight to the program detail page. */
  eventPathTemplate?: string
  /** Connection indicator, shown in the opaque header (G4-03). */
  liveStatus?: ReactNode
}

/** Messages with one person (oldest at the top, newest at the bottom, a divider per day) and the composer. */
export function ChatThread({ partnerId, partnerName, partnerSubtitle, selfId, draft: controlledDraft, onDraftChange, eventPathTemplate, liveStatus }: Readonly<ChatThreadProps>) {
  const { message } = App.useApp()
  const thread = useThread(partnerId)
  const send = useSendMessage()
  const [localDraft, setLocalDraft] = useState('')
  const draft = controlledDraft ?? localDraft
  const setDraft = onDraftChange ?? setLocalDraft
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
      <ChatHeader partnerName={partnerName} subtitle={partnerSubtitle} liveStatus={liveStatus} />
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
        {notes.map((note, index) => (
          <Fragment key={note.id}>
            {(index === 0 || localDay(notes[index - 1].sentAt) !== localDay(note.sentAt)) && <ChatDateDivider date={note.sentAt} />}
            <Bubble note={note} mine={note.fromUserId === selfId} eventPathTemplate={eventPathTemplate} />
          </Fragment>
        ))}
        <div ref={bottom} />
      </Flex>
      <Flex gap={8} align="flex-end" style={{ padding: 12, borderTop: `1px solid ${colors.border}` }}>
        <span id={`composer-hint-${partnerId}`} style={visuallyHidden}>
          Enter để gửi, Shift+Enter để xuống dòng.
        </span>
        <Input.TextArea
          aria-label={`Nhắn cho ${partnerName}`}
          aria-describedby={`composer-hint-${partnerId}`}
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
        <Button type="primary" icon={<Icon name="send" />} loading={send.isPending} disabled={!draft.trim()} onClick={submit}>
          Gửi
        </Button>
      </Flex>
    </Flex>
  )
}
