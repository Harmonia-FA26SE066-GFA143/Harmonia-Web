import { SendOutlined } from '@ant-design/icons'
import { App, Button, Card } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { NoteTable } from '../components/NoteTable'
import { SendNoteModal } from '../components/SendNoteModal'
import { useNotes, useSendNote } from '../hooks/useNotes'
import { noteErrorMessage } from '../notesErrors'
import type { DirectorNoteValues } from '../types'

const pageSize = 20

/**
 * Notes from the Parish Priest to Choir Directors (FE-23, `/api/director-notes`). The Parish Priest sends and lists
 * the copies sent, one row per Choir Director; a Choir Director lists the notes received. Newest first.
 */
function NotesPage({ sender }: { sender: boolean }) {
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [sending, setSending] = useState(false)
  const notes = useNotes({ pageNumber: page, pageSize })
  const send = useSendNote()
  const total = notes.data?.totalCount ?? 0

  const handleSend = (values: DirectorNoteValues) =>
    send.mutate(values, {
      onSuccess: () => {
        message.success('Đã gửi ghi chú. Ca trưởng sẽ nhận được thông báo.')
        setSending(false)
        setPage(1)
      },
      onError: (error) => message.error(noteErrorMessage(error, 'Không thể gửi ghi chú. Vui lòng thử lại.')),
    })

  return (
    <>
      <PageHeader
        title={sender ? 'Ghi chú cho Ca trưởng' : 'Ghi chú từ Cha xứ'}
        breadcrumb={[{ title: sender ? 'Cha xứ' : 'Ca trưởng' }, { title: 'Ghi chú' }]}
        description={
          sender
            ? 'Ghi chú và yêu cầu gửi Ca trưởng về một ngày hoặc một sự kiện. Mới nhất ở trên cùng.'
            : 'Ghi chú và yêu cầu Cha xứ gửi cho bạn. Mới nhất ở trên cùng.'
        }
        extra={
          sender && (
            <Button type="primary" icon={<SendOutlined />} onClick={() => setSending(true)}>
              Gửi ghi chú
            </Button>
          )
        }
      />

      {notes.isPending && <SectionSkeleton rows={5} label="Đang tải ghi chú" />}
      {notes.isError && <ErrorState title="Không thể tải ghi chú" onRetry={() => notes.refetch()} retrying={notes.isFetching} />}
      {notes.isSuccess && total === 0 && (
        <EmptyState
          title={sender ? 'Chưa gửi ghi chú nào' : 'Chưa có ghi chú nào'}
          description={
            sender
              ? 'Ghi chú đã gửi cho Ca trưởng sẽ xuất hiện tại đây.'
              : 'Khi Cha xứ gửi ghi chú, bạn sẽ nhận được thông báo và ghi chú xuất hiện tại đây.'
          }
        />
      )}
      {notes.isSuccess && total > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <NoteTable
            notes={notes.data.items}
            party={sender ? 'recipient' : 'sender'}
            page={page}
            pageSize={pageSize}
            total={total}
            loading={notes.isPlaceholderData}
            onPageChange={setPage}
          />
        </Card>
      )}

      {sender && (
        <SendNoteModal open={sending} saving={send.isPending} onSubmit={handleSend} onCancel={() => setSending(false)} />
      )}
    </>
  )
}

export const PriestNotesPage = () => <NotesPage sender />

export const DirectorNotesPage = () => <NotesPage sender={false} />
