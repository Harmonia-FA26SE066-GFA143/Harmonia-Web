import { Alert, App, Button, ConfigProvider, Flex, Typography } from 'antd'
import { useState } from 'react'
import { generatePath, Link, useNavigate, useParams } from 'react-router'
import { readingTheme } from '@/app/theme'
import { paths } from '@/app/router/paths'
import { EventChoirsCard } from '@/features/choirs'
import { participationErrorMessage, useRemindParticipation } from '@/features/participation'
import { CANCEL_LABEL, EmptyState, ErrorState, FormDrawer, Icon, LostLeaf, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { colors, component, spacing } from '@/styles/tokens'
import { EventForm } from '../components/EventForm'
import { EventStatusTag } from '../components/EventStatusTag'
import { PreparationStatusCard } from '../components/PreparationStatusCard'
import { PreparationOverview } from '../components/PreparationOverview'
import { PriestAdjacentNav } from '../components/AdjacentProgramNav'
import { ProgramHeader } from '../components/ProgramHeader'
import { ProgramItemList } from '../components/ProgramItemList'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { eventErrorMessage } from '../eventErrors'
import { inviteServingMembers, type InviteOutcome, useCancelEvent, useEvent, usePreparationStatus, usePublishEvent, useUpdateEvent } from '../hooks/useEvents'
import { useEventNames } from '../hooks/useEventNames'
import { useProgram } from '../hooks/usePrograms'
import { formatDateTime, vietnamToday } from '@/lib/api/dates'
import { formatProgramDate } from '../programFilters'
import { preparationItems } from '../preparationOverview'
import type { EventFormValues, LiturgicalEvent } from '../types'

const editFormId = 'priest-edit-event-form'
const breadcrumb = [{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

/** Independent preparation items from FE-21 (`preparation-status`). */
function PriestSteps({ event }: Readonly<{ event: LiturgicalEvent }>) {
  const status = usePreparationStatus(event.id)
  const items = preparationItems({
    date: event.date,
    songListStatus: status.data?.songListStatus,
    status: status.data,
    failed: status.isError,
    viewer: 'priest',
  })
  return (
    <section className="hm-sheet-section priest-queue hm-paper" aria-labelledby="prep-heading">
      <header className="hm-sheet-section__head">
        <h2 id="prep-heading" className="hm-rubric">
          Tình hình chuẩn bị
        </h2>
      </header>
      <div className="priest-sheet__body">
        {status.isPending && <SectionSkeleton rows={2} label="Đang tải tình hình chuẩn bị" />}
        {status.isError && (
          <ErrorState headingLevel={3} title="Không thể tải tiến trình chuẩn bị" error={status.error} hasData={false} onRetry={() => status.refetch()} retrying={status.isFetching} />
        )}
        {/* One column: the aside is a third of the page wide (G3-07). */}
        {status.isSuccess && <PreparationOverview items={items} columns={1} />}
      </div>
    </section>
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
      <section className="hm-sheet-section priest-reading" aria-labelledby="songs-heading">
        <header className="hm-sheet-section__head">
          <Flex align="center" gap={spacing.sm} wrap>
            <h2 id="songs-heading" className="hm-rubric">
              Chương trình
            </h2>
            {program.data && <SongListStatusTag status={program.data.songListStatus} />}
          </Flex>
          {songs.length > 0 && (
            <Link to={reviewPath} className="hm-sheet-section__link">
              {program.data?.songListStatus === 'submitted' ? 'Duyệt danh sách bài hát' : 'Xem tài liệu và lịch sử duyệt'}
            </Link>
          )}
        </header>
        <div className="priest-sheet__body">
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
        </div>
      </section>
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
  const remind = useRemindParticipation(programId ?? '')
  const { eventName, name } = useEventNames()
  const [editing, setEditing] = useState(false)

  const backButton = (
    <Button icon={<Icon name="arrow-left" />} onClick={() => navigate(paths.priest.programs)}>
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
            icon={<LostLeaf width={180} />}
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
  const draft = data.status === 'draft'
  const pastDraft = draft && !upcoming
  const canCancel = !cancelled && upcoming
  // The backend refuses to publish a past event, or one without a season (LITURGICAL_EVENT_SEASON_REQUIRED).
  const canPublish = draft && upcoming
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

  // The event is published either way; only the members' participation requests are missing.
  const inviteFailed = () =>
    message.warning({
      key: 'invite-failed',
      duration: 0,
      content: (
        <>
          Đã công bố sự kiện, nhưng chưa gửi được lời mời xác nhận tham gia cho ca viên.{' '}
          <Button
            size="small"
            onClick={() => {
              message.destroy('invite-failed')
              void inviteServingMembers(data.id).then((invited) => invitedMessage(invited, 'Đã gửi lời mời xác nhận tham gia cho ca viên.'))
            }}
          >
            Gửi lại
          </Button>{' '}
          <Button size="small" type="text" onClick={() => message.destroy('invite-failed')}>
            Đóng
          </Button>
        </>
      ),
    })

  // Offered on every published upcoming event; the backend says when nobody is due (BE 69c9d47).
  const handleRemind = () =>
    remind.mutate(undefined, {
      onSuccess: ({ remindedCount, pendingCount }) =>
        message.success(
          pendingCount === 0
            ? 'Mọi ca viên được mời đã phản hồi.'
            : `Đã nhắc ${remindedCount} trong ${pendingCount} ca viên chưa phản hồi.`,
        ),
      onError: (error) => message.error(participationErrorMessage(error, 'Không thể gửi lời nhắc. Vui lòng thử lại.')),
    })

  /** Says what the invitation did: sent, nobody in the serving choirs to ask, or failed (with a way to send again). */
  const invitedMessage = (invited: InviteOutcome, sent: string) => {
    if (invited === 'failed') return inviteFailed()
    if (invited === 'sent') return message.success(sent)
    return message.warning({ duration: 8, content: 'Đã công bố sự kiện, nhưng chưa mời được ai: các ca đoàn phục vụ chưa có ca viên nào để mời. Quản trị viên thêm ca viên vào ca đoàn ở trang Ca đoàn.' })
  }

  const confirmPublish = () =>
    modal.confirm({
      title: 'Công bố sự kiện?',
      content: 'Ca trưởng nhận thông báo, ca viên của các ca đoàn phục vụ được mời xác nhận tham gia, và sự kiện hiện trong lịch.',
      okText: 'Công bố',
      cancelText: CANCEL_LABEL,
      onOk: () =>
        publish
          .mutateAsync(data.id)
          .then(({ invited }) => invitedMessage(invited, 'Đã công bố sự kiện và mời ca viên xác nhận tham gia.'))
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
      focusable: { autoFocusButton: 'cancel' },
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
            <PriestAdjacentNav id={data.id} date={data.date} />
            {backButton}
            {!cancelled && (
              <Button icon={<Icon name="edit" />} onClick={() => setEditing(true)}>
                Sửa sự kiện
              </Button>
            )}
            {data.status === 'published' && upcoming && (
              <Button icon={<Icon name="notification" />} onClick={handleRemind} loading={remind.isPending}>
                Nhắc xác nhận tham gia
              </Button>
            )}
            {/* The danger action in its own group (artifact PriestProgramDetail). */}
            {canCancel && <span className="priest-actions__gap" aria-hidden />}
            {canCancel && (
              <Button danger icon={<Icon name="close-circle" />} onClick={confirmCancel}>
                Hủy sự kiện
              </Button>
            )}
            {draft && (
              <Button type="primary" disabled={pastDraft} onClick={canPublish ? confirmPublish : undefined}>
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
        {pastDraft && (
          <Alert
            type="warning"
            showIcon
            title="Sự kiện đã qua"
            description={`Bản nháp này không thể công bố vì ngày tổ chức là ${formatProgramDate(data.date)}. Nếu ngày chưa đúng, hãy cập nhật lại.`}
            action={
              <Button size="small" onClick={() => setEditing(true)}>
                Sửa ngày tổ chức
              </Button>
            }
          />
        )}
        {needsSeason && (
          <Alert
            type="warning"
            showIcon
            title="Chưa chọn mùa phụng vụ"
            description="Sự kiện cần có mùa phụng vụ trước khi công bố. Bấm “Sửa sự kiện” để chọn mùa."
          />
        )}
        {/* Preparation starts once the event is published; a draft or a cancelled event shows only its choirs. */}
        {data.status === 'published' ? (
          <div className="dash-grid">
            <div className="dash-main">
              <PriestProgramSongs eventId={data.id} />
              <EventChoirsCard eventId={data.id} canEdit locked={cancelled || !upcoming} published />
            </div>
            <aside className="dash-aside dash-main" aria-label="Tình hình chuẩn bị">
              <PriestSteps event={data} />
              <PreparationStatusCard eventId={data.id} />
            </aside>
          </div>
        ) : (
          <EventChoirsCard eventId={data.id} canEdit locked={cancelled || !upcoming} published={false} />
        )}
      </Flex>
      {/* The footer's save submits the form by its id; while saving the drawer cannot be closed (FormDrawer). */}
      <FormDrawer
        open={editing}
        title="Sửa sự kiện"
        okText="Lưu thay đổi"
        okButtonProps={{ htmlType: 'submit', form: editFormId, loading: update.isPending }}
        cancelButtonProps={{ disabled: update.isPending }}
        size={component.drawer.lg}
        onCancel={() => setEditing(false)}
        destroyOnHidden
      >
        <EventForm formId={editFormId} hideActions event={data} saving={update.isPending} onSubmit={handleUpdate} />
      </FormDrawer>
    </>
  )
}
