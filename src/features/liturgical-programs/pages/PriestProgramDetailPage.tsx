import { ArrowLeftOutlined, EditOutlined, FileSearchOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Flex, Modal } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { EventForm } from '../components/EventForm'
import { EventInfo } from '../components/EventInfo'
import { PreparationStatusCard } from '../components/PreparationStatusCard'
import { eventErrorMessage } from '../eventErrors'
import { useCancelEvent, useEvent, usePublishEvent, useUpdateEvent } from '../hooks/useEvents'
import { useEventNames } from '../hooks/useEventNames'
import { formatProgramDate, vietnamToday } from '../programFilters'
import type { EventFormValues, LiturgicalEvent } from '../types'

const breadcrumb = [{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

/**
 * Priest: one liturgical event (FE-15–FE-16) with the actions the backend allows (LiturgicalEventService): edit
 * unless cancelled, publish a Draft, cancel unless already cancelled or past. Publishing and cancelling a published
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
  const { eventName } = useEventNames()
  const [editing, setEditing] = useState(false)

  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.priest.programs)}>
      Về danh sách
    </Button>
  )

  if (event.isPending) return <PageSkeleton sections={2} />
  if (event.isError || !event.data) {
    return (
      <>
        <PageHeader title="Chi tiết chương trình phụng vụ" breadcrumb={breadcrumb} extra={backButton} />
        {event.isError ? (
          <ErrorState title="Không thể tải chương trình" onRetry={() => event.refetch()} retrying={event.isFetching} />
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
  const canCancel = !cancelled && data.date >= vietnamToday()

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
      title: 'Hủy sự kiện?',
      content:
        data.status === 'published'
          ? 'Sự kiện đã công bố: Ca trưởng và ca viên sẽ nhận thông báo hủy. Không thể hoàn tác.'
          : 'Bản nháp sẽ bị hủy. Không thể hoàn tác.',
      okText: 'Hủy sự kiện',
      okButtonProps: { danger: true },
      cancelText: 'Quay lại',
      onOk: () =>
        cancel
          .mutateAsync(data.id)
          .then(() => message.success('Đã hủy sự kiện.'))
          .catch((error: Error) => message.error(eventErrorMessage(error, 'Không thể hủy sự kiện. Vui lòng thử lại.'))),
    })

  return (
    <>
      <PageHeader
        title={eventName(data)}
        breadcrumb={breadcrumb}
        description={`${formatProgramDate(data.date)} · ${data.time} · ${data.locationName}`}
        extra={
          <Flex wrap gap={spacing.sm}>
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
            {data.status === 'draft' && (
              <Button type="primary" onClick={confirmPublish}>
                Công bố
              </Button>
            )}
          </Flex>
        }
      />
      <Flex vertical gap={spacing.lg}>
        <EventInfo event={data} />
        {data.status === 'published' && <PreparationStatusCard eventId={data.id} />}
      </Flex>
      <Modal
        open={editing}
        title="Sửa sự kiện"
        footer={null}
        width={760}
        onCancel={() => setEditing(false)}
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
      </Modal>
    </>
  )
}
