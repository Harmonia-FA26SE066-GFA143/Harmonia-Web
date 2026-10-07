import { App, Card, Modal } from 'antd'
import { useRef, useState } from 'react'
import { generatePath, useBeforeUnload, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { PageHeader } from '@/shared/ui'
import { EventForm } from '../components/EventForm'
import { eventErrorMessage } from '../eventErrors'
import { useCreateEvent } from '../hooks/useEvents'
import type { EventFormValues } from '../types'

/**
 * Priest: create a liturgical event (FE-15–FE-16, `POST /api/liturgical-events`). It starts as a Draft and is
 * published from its detail page. `?date=YYYY-MM-DD` preselects the date (from the calendar). Leaving with unsaved
 * input asks for confirmation.
 */
export function CreateProgramPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const create = useCreateEvent()
  const [dirty, setDirty] = useState(false)
  // Set once the event is saved; read at navigation time so the redirect to the new event is not blocked.
  const saved = useRef(false)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saved.current && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload((event) => {
    if (dirty && !saved.current) event.preventDefault()
  })

  const initialDate = searchParams.get('date') ?? undefined

  const handleSubmit = (values: EventFormValues) =>
    create.mutate(values, {
      onSuccess: (event) => {
        message.success('Đã tạo bản nháp sự kiện.')
        saved.current = true
        navigate(generatePath(paths.priest.programDetail, { programId: event.id }))
      },
      // The form keeps its values so nothing is lost.
      onError: (error) => message.error(eventErrorMessage(error, 'Không thể lưu chương trình. Vui lòng thử lại.')),
    })

  return (
    <>
      <PageHeader
        title="Tạo chương trình phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Tạo chương trình' }]}
        description="Nhập thông tin sự kiện phụng vụ. Sự kiện được lưu dưới dạng bản nháp; công bố ở trang chi tiết."
      />
      <Card>
        <EventForm
          initialDate={initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : undefined}
          saving={create.isPending}
          submitText="Lưu bản nháp"
          onSubmit={handleSubmit}
          onCancel={() => navigate(paths.priest.programs)}
          onDirty={() => setDirty(true)}
        />
      </Card>
      <Modal
        open={blocker.state === 'blocked'}
        title="Rời khỏi trang tạo chương trình?"
        okText="Rời khỏi trang"
        cancelText="Ở lại"
        okButtonProps={{ danger: true }}
        onOk={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        Thông tin bạn vừa nhập sẽ không được lưu nếu rời khỏi trang lúc này.
      </Modal>
    </>
  )
}
