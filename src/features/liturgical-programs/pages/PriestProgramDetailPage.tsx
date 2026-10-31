import { ArrowLeftOutlined, EditOutlined, FileSearchOutlined, StopOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, ConfigProvider, Drawer, Flex, Typography } from 'antd'
import { useState } from 'react'
import { generatePath, Link, useNavigate, useParams } from 'react-router'
import { readingTheme } from '@/app/theme'
import { paths } from '@/app/router/paths'
import { EventChoirsCard } from '@/features/choirs'
import { CardTitle, EmptyState, ErrorState, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, spacing } from '@/styles/tokens'
import { EventForm } from '../components/EventForm'
import { EventStatusTag } from '../components/EventStatusTag'
import { PreparationStatusCard } from '../components/PreparationStatusCard'
import { PreparationSteps } from '../components/PreparationSteps'
import { ProgramHeader } from '../components/ProgramHeader'
import { ProgramItemList } from '../components/ProgramItemList'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { eventErrorMessage } from '../eventErrors'
import { useCancelEvent, useEvent, usePreparationStatus, usePublishEvent, useUpdateEvent } from '../hooks/useEvents'
import { useEventNames } from '../hooks/useEventNames'
import { useProgram } from '../hooks/usePrograms'
import { formatDateTime, vietnamToday } from '@/lib/api/dates'
import { preparationSteps } from '../preparationSteps'
import type { EventFormValues, LiturgicalEvent } from '../types'

const breadcrumb = [{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

/** The six numbered steps and the page's one bookmark ribbon, from FE-21 (`preparation-status`, Priest only). */
function PriestSteps({ event }: Readonly<{ event: LiturgicalEvent }>) {
  const status = usePreparationStatus(event.id)
  const steps = preparationSteps({
    date: event.date,
    songListStatus: status.data?.songListStatus,
    status: status.data,
    failed: status.isError,
    viewer: 'priest',
  })
  return (
    <Card style={cardSurface} title={<CardTitle>Tiến trình chuẩn bị</CardTitle>}>
      {status.isPending && <SectionSkeleton rows={2} label="Đang tải tiến trình chuẩn bị" />}
      {status.isError && (
        <ErrorState headingLevel={3} title="Không thể tải tiến trình chuẩn bị" error={status.error} hasData={false} onRetry={() => status.refetch()} retrying={status.isFetching} />
      )}
      {status.isSuccess && <PreparationSteps steps={steps} bookmark />}
    </Card>
  )
}

/**
 * The songs of the newest list in order (`/api/song-lists/event/{id}/latest` through useProgram), read on ivory;
 * their materials, the Choir Director's notes and the review history are on the review page.
 */
function PriestProgramSongs({ eventId }: Readonly<{ eventId: string }>) {
  const program = useProgram(eventId)
  const songs = program.data?.songs ?? []
  const reviewPath = generatePath(paths.priest.songListReview, { programId: eventId })
  return (
    <ConfigProvider theme={readingTheme}>
      <Card
        style={{ border: cardSurface.border, boxShadow: 'none' }}
        title={
          <Flex align="center" gap={spacing.sm} wrap>
            <CardTitle>Chương trình</CardTitle> {program.data && <SongListStatusTag status={program.data.songListStatus} />}
          </Flex>
        }
        extra={
          songs.length > 0 && (
            <Link to={reviewPath} style={{ fontWeight: 500 }}>
              {program.data?.songListStatus === 'submitted' ? 'Duyệt danh sách bài hát' : 'Xem tài liệu và lịch sử duyệt'}
            </Link>
          )
        }
      >
        {program.isPending && <SectionSkeleton rows={3} label="Đang tải danh sách bài hát" />}
        {program.isError && (
          <ErrorState headingLevel={3} title="Không thể tải danh sách bài hát" error={program.error} hasData={false} onRetry={() => program.refetch()} retrying={program.isFetching} />
        )}
        {program.isSuccess && songs.length === 0 && (
          <Typography.Text style={{ color: colors.textMuted }}>Ca trưởng chưa gửi danh sách bài hát cho chương trình này.</Typography.Text>
        )}
        {songs.length > 0 && (
          <ProgramItemList items={songs.map(({ id, songId, liturgicalPart, title, note }) => ({ id, songId, slotName: liturgicalPart, title, note }))} />
        )}
      </Card>
    </ConfigProvider>
  )
}

/**
 * Priest: one liturgical event (FE-15–FE-16) with the actions the backend allows (LiturgicalEventService): edit
 * unless cancelled, publish an upcoming Draft that has a season, cancel unless already cancelled or past. Publishing and cancelling a published
 * event notify Choir Directors and members. A published event shows how ready the choir is (FE-21), with its song
 * list status and a link to the review page; the Choir Director proposes a list once the event is published.
 */
export function PriestProgramDetailPage() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { programId = '' } = useParams()
  const event = useEvent(programId)
  const update = useUpdateEvent()
  const publish = usePublishEvent()
  const cancel = useCancelEvent()
  const { eventName, name } = useEventNames()
  const [editing, setEditing] = useState(false)

  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.priest.programs)}>
      Về danh sách
    </Button>
  )

  if (event.isPending) return <PageSkeleton sections={2} />
  if (!event.data) {
    return (
      <>
        <PageHeader title="Chi tiết chương trình phụng vụ" breadcrumb={breadcrumb} extra={backButton} />
        {event.isError ? (
          <ErrorState title="Không thể tải chương trình" error={event.error} hasData={event.data !== undefined} onRetry={() => event.refetch()} retrying={event.isFetching} />
        ) : (
          <EmptyState
            icon={<FileSearchOutlined />}
            title="Không tìm thấy chương trình phụng vụ"
            description="Chương trình không tồn tại hoặc đường dẫn không đúng."
            action={backButton}
          />
        )}
      </>
    )
  }

  const data: LiturgicalEvent = event.data
  const cancelled = data.status === 'cancelled'
  const upcoming = data.date >= vietnamToday()
  const canCancel = !cancelled && upcoming
  // The backend refuses to publish a past event, or one without a season (LITURGICAL_EVENT_SEASON_REQUIRED).
  const canPublish = data.status === 'draft' && upcoming
  const needsSeason = canPublish && !data.seasonId
  const type = name('massType', data.massTypeId) || name('ceremonyType', data.ceremonyTypeId)
  const details = [
    data.title && type,
    name('category', data.categoryId),
    data.specialRequirements && `Yêu cầu đặc biệt: ${data.specialRequirements}`,
    data.publishedAt && `Công bố lúc ${formatDateTime(data.publishedAt)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const handleUpdate = (values: EventFormValues) =>
    update.mutate(
      { id: data.id, values },
      {
        onSuccess: () => {
          message.success('Đã lưu thay đổi.')
          setEditing(false)
        },
        onError: (error) => message.error(eventErrorMessage(error, 'Không thể lưu thay đổi. Vui lòng thử lại.')),
      },
    )

  const confirmPublish = () =>
    modal.confirm({
      title: 'Công bố sự kiện?',
      content: 'Ca trưởng và ca viên sẽ nhận thông báo và thấy sự kiện này trong lịch.',
      okText: 'Công bố',
      cancelText: 'Hủy',
      onOk: () =>
        publish
          .mutateAsync(data.id)
          .then(() => message.success('Đã công bố sự kiện.'))
          .catch((error: Error) => message.error(eventErrorMessage(error, 'Không thể công bố sự kiện. Vui lòng thử lại.'))),
    })

  const confirmCancel = () =>
    modal.confirm({
      title: `Hủy sự kiện “${eventName(data)}”?`,
      content:
        data.status === 'published'
          ? 'Sự kiện đã công bố: Ca trưởng và ca viên sẽ nhận thông báo hủy. Không thể hoàn tác.'
          : 'Bản nháp sẽ bị hủy. Không thể hoàn tác.',
      okText: 'Hủy sự kiện',
      okButtonProps: { danger: true },
      cancelText: 'Quay lại',
      // Enter on a destructive dialog must not run it.
      autoFocusButton: 'cancel',
      onOk: () =>
        cancel
          .mutateAsync(data.id)
          .then(() => message.success('Đã hủy sự kiện.'))
          .catch((error: Error) => message.error(eventErrorMessage(error, 'Không thể hủy sự kiện. Vui lòng thử lại.'))),
    })

  return (
    <>
      <ProgramHeader
        title={eventName(data)}
        date={data.date}
        time={data.time}
        place={data.locationName}
        seasonName={name('season', data.seasonId)}
        status={<EventStatusTag status={data.status} />}
        details={details || undefined}
        breadcrumb={breadcrumb}
        actions={
          <>
            {backButton}
            {!cancelled && (
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                Sửa
              </Button>
            )}
            {canCancel && (
              <Button danger icon={<StopOutlined />} onClick={confirmCancel}>
                Hủy sự kiện
              </Button>
            )}
            {canPublish && (
              <Button type="primary" onClick={confirmPublish}>
                Công bố
              </Button>
            )}
          </>
        }
      />
      {event.isError && (
        <ErrorState title="Không thể cập nhật chương trình" error={event.error} hasData onRetry={() => event.refetch()} retrying={event.isFetching} />
      )}
      <Flex vertical gap={spacing.lg}>
        {needsSeason && (
          <Alert
            type="warning"
            showIcon
            title="Chưa chọn mùa phụng vụ"
            description="Sự kiện cần có mùa phụng vụ trước khi công bố. Bấm “Sửa” để chọn mùa."
          />
        )}
        {data.status === 'published' && <PriestSteps event={data} />}
        {data.status === 'published' && <PriestProgramSongs eventId={data.id} />}
        <EventChoirsCard eventId={data.id} canEdit locked={cancelled || !upcoming} />
        {data.status === 'published' && <PreparationStatusCard eventId={data.id} />}
      </Flex>
      {/* The form has its own Save and Cancel; while saving the drawer cannot be closed. */}
      <Drawer
        open={editing}
        title="Sửa sự kiện"
        size={760}
        onClose={() => setEditing(false)}
        closable={!update.isPending}
        keyboard={!update.isPending}
        mask={{ closable: !update.isPending }}
        destroyOnHidden
      >
        <EventForm
          event={data}
          saving={update.isPending}
          submitText="Lưu thay đổi"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </Drawer>
    </>
  )
}
