import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex } from 'antd'
import dayjs from 'dayjs'
import { generatePath, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useEvent, useEventNames } from '@/features/liturgical-programs'
import { parseUtc } from '@/lib/api/dates'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ReviewForm } from '../components/ReviewForm'
import { SongListItemsTable } from '../components/SongListItemsTable'
import { useApprovedSongList, usePendingSongLists, useReviewSongList, useSongList } from '../hooks/useSongListReview'
import { reviewErrorMessage } from '../songListReviewErrors'
import type { ReviewDecision, ReviewValues, SongList } from '../types'

const breadcrumb = [
  { title: 'Cha xứ' },
  { title: 'Chương trình phụng vụ' },
  { title: 'Chi tiết chương trình' },
  { title: 'Duyệt danh sách bài hát' },
]

const at = (value?: string) => (value ? ` lúc ${dayjs(parseUtc(value)).format('HH:mm DD/MM/YYYY')}` : '')

const confirmations: Record<ReviewDecision, { title: string; content: string; done: string }> = {
  approve: {
    title: 'Phê duyệt danh sách bài hát?',
    content: 'Danh sách được khoá sau khi phê duyệt. Ca trưởng sẽ nhận thông báo.',
    done: 'Đã phê duyệt danh sách bài hát.',
  },
  requestRevision: {
    title: 'Yêu cầu Ca trưởng chỉnh sửa?',
    content: 'Ca trưởng sẽ nhận thông báo kèm ghi chú và gửi lại một phiên bản mới.',
    done: 'Đã gửi yêu cầu chỉnh sửa cho Ca trưởng.',
  },
  reject: {
    title: 'Từ chối danh sách bài hát?',
    content: 'Ca trưởng sẽ nhận thông báo kèm lý do và biên soạn một phiên bản mới.',
    done: 'Đã từ chối danh sách bài hát.',
  },
}

function ListStatus({ list }: { list: SongList }) {
  if (list.status === 'approved') {
    return (
      <Alert
        type="success"
        showIcon
        title={`Danh sách đã được phê duyệt${at(list.decidedAt)}.`}
        description={list.reviews.at(-1)?.notes && `Ghi chú: “${list.reviews.at(-1)?.notes}”`}
      />
    )
  }
  return (
    <Alert
      type="info"
      showIcon
      title={`Ca trưởng đã gửi danh sách (phiên bản ${list.version})${at(list.submittedAt)}.`}
      description={
        list.version > 1
          ? 'Bản gửi lại sau lần xem xét trước. Xem cả danh sách rồi chọn một quyết định.'
          : 'Xem cả danh sách rồi chọn một quyết định.'
      }
    />
  )
}

/**
 * Priest / Liturgy Committee: the song list the Choir Director submitted for an event, decided as a whole (FE-17–FE-20,
 * `/api/song-lists`): approve, request a revision or reject, with a note the Choir Director reads. An approved list is
 * shown read-only. A list being drafted or revised cannot be read by event yet (tbd-backlog B14).
 */
export function SongListReviewPage() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { programId = '' } = useParams()
  const event = useEvent(programId)
  const pending = usePendingSongLists()
  const pendingId = pending.data?.find((list) => list.eventId === programId)?.id
  const submitted = useSongList(pendingId)
  const approved = useApprovedSongList(programId)
  const review = useReviewSongList()
  const { eventName } = useEventNames()

  const toProgram = () => navigate(generatePath(paths.priest.programDetail, { programId }))
  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={toProgram}>
      Về chương trình
    </Button>
  )

  if (event.isPending || pending.isPending || approved.isPending || (pendingId && submitted.isPending)) {
    return <PageSkeleton sections={2} />
  }

  const failed = event.isError || pending.isError || approved.isError || submitted.isError
  const list = submitted.data ?? approved.data ?? undefined

  const handleReview = (values: ReviewValues) => {
    if (!list) return
    const { title, content, done } = confirmations[values.decision]
    modal.confirm({
      title,
      content,
      okText: 'Gửi quyết định',
      okButtonProps: { danger: values.decision === 'reject' },
      cancelText: 'Hủy',
      onOk: () =>
        review
          .mutateAsync({ id: list.id, values })
          .then(() => {
            message.success(done)
            toProgram()
          })
          .catch((error: Error) => message.error(reviewErrorMessage(error, 'Không thể gửi quyết định. Vui lòng thử lại.'))),
    })
  }

  return (
    <>
      <PageHeader
        title="Duyệt danh sách bài hát"
        breadcrumb={breadcrumb}
        description={event.data && `${eventName(event.data)} · ${formatProgramDate(event.data.date)} · ${event.data.time}`}
        extra={backButton}
      />
      {failed && (
        <ErrorState
          title="Không thể tải danh sách bài hát"
          onRetry={() => Promise.all([event.refetch(), pending.refetch(), approved.refetch(), submitted.refetch()])}
          retrying={event.isFetching || pending.isFetching || approved.isFetching || submitted.isFetching}
        />
      )}
      {!failed && !event.data && (
        <EmptyState
          icon={<FileSearchOutlined />}
          title="Không tìm thấy chương trình phụng vụ"
          description="Chương trình không tồn tại hoặc đường dẫn không đúng."
        />
      )}
      {!failed && event.data && !list && (
        <EmptyState
          title="Không có danh sách chờ duyệt"
          description="Ca trưởng chưa gửi danh sách bài hát cho sự kiện này, hoặc đang chỉnh sửa theo yêu cầu."
        />
      )}
      {!failed && event.data && list && (
        <Flex vertical gap={spacing.lg}>
          <ListStatus list={list} />
          <Card title={`Danh sách bài hát (${list.items.length})`} styles={{ body: { padding: 0 } }}>
            <SongListItemsTable items={list.items} />
          </Card>
          {list.status === 'submitted' && <ReviewForm saving={review.isPending} onSubmit={handleReview} />}
        </Flex>
      )}
    </>
  )
}
