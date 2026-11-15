import { App, Modal } from 'antd'
import { useRef, useState } from 'react'
import { generatePath, useBeforeUnload, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { useCatalogOptions } from '@/features/system-categories'
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
  const seasons = useCatalogOptions('seasons')
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
      onSuccess: ({ event, invited }) => {
        // Left empty, the season is filled by the backend with the one covering the date (BE d1ca63e).
        const filled = !values.seasonId && event.seasonId && seasons.find((season) => season.value === event.seasonId)
        const created = values.isPublished ? 'Đã tạo và công bố sự kiện' : 'Đã tạo bản nháp sự kiện'
        message.success(filled ? `${created}, mùa phụng vụ được điền là ${filled.label}.` : `${created}.`)
        // Published at once: the members were invited like a publish from the detail page, which offers to resend.
        if (!invited) message.warning('Chưa gửi được lời mời cho ca viên. Mở chương trình để gửi lại.')
        saved.current = true
        navigate(generatePath(paths.priest.programDetail, { programId: event.id }))
      },
      // The form keeps its values so nothing is lost.
      onError: (error) => message.error(eventErrorMessage(error, 'Không thể lưu chương trình. Vui lòng thử lại.')),
    })

  return (
    <>
      <PageHeader
        title="Tạo chương trình"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Tạo chương trình' }]}
        description="Lưu bản nháp để công bố sau, hoặc tạo và công bố ngay."
      />
      {/* A long form on its own page with a short summary on the right third (artifact PriestCreateProgram). */}
      <div className="hm-split priest-create">
        <section className="hm-sheet-section priest-form" aria-label="Thông tin sự kiện">
          <EventForm
            initialDate={initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : undefined}
            saving={create.isPending}
            submitText="Lưu bản nháp"
            publishText="Tạo và công bố"
            onSubmit={handleSubmit}
            onCancel={() => navigate(paths.priest.programs)}
            onDirty={() => setDirty(true)}
          />
        </section>
        {/* What the backend does with the event (LiturgicalEventService); nothing here is decided by the page. */}
        <aside className="hm-preview hm-paper" aria-labelledby="after-save-heading">
          <p id="after-save-heading" className="hm-rubric">
            Sau khi lưu
          </p>
          <ul className="priest-day-events priest-facts">
            <li>Sự kiện được lưu là bản nháp; Ca trưởng chưa thấy.</li>
            <li>Công bố cần có mùa phụng vụ. Để trống, mùa của ngày cử hành được điền sẵn.</li>
            <li>Khi công bố, Ca trưởng nhận thông báo và ca viên của các ca đoàn phục vụ được mời xác nhận tham gia.</li>
          </ul>
        </aside>
      </div>
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
