import { App, Button, Flex, Modal } from 'antd'
import { useRef, useState } from 'react'
import { generatePath, Link, useBeforeUnload, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { useCatalogOptions } from '@/features/system-categories'
import { CANCEL_LABEL, PageHeader } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { EventForm } from '../components/EventForm'
import { eventErrorMessage } from '../eventErrors'
import { useCreateEvent } from '../hooks/useEvents'
import type { EventFormValues } from '../types'

const formId = 'priest-create-event-form'

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
  const [submitMode, setSubmitMode] = useState<'draft' | 'publish' | null>(null)
  // Set once the event is saved; read at navigation time so the redirect to the new event is not blocked.
  const saved = useRef(false)
  // Set by the clicked submit button in the summary; the form resets it after each submit attempt.
  const publishRef = useRef(false)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saved.current && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload((event) => {
    if (dirty && !saved.current) event.preventDefault()
  })

  const initialDate = searchParams.get('date') ?? undefined

  const handleSubmit = (values: EventFormValues) => {
    setSubmitMode(values.isPublished ? 'publish' : 'draft')
    create.mutate(values, {
      onSuccess: ({ event, invited }) => {
        // Left empty, the season is filled by the backend with the one covering the date (BE d1ca63e).
        const filled = !values.seasonId && event.seasonId && seasons.find((season) => season.value === event.seasonId)
        const created = values.isPublished ? 'Đã tạo và công bố sự kiện' : 'Đã tạo bản nháp sự kiện'
        message.success(filled ? `${created}, mùa phụng vụ được điền là ${filled.label}.` : `${created}.`)
        // Published at once: the members were invited like a publish from the detail page, which offers to resend.
        if (invited === 'failed') message.warning('Chưa gửi được lời mời cho ca viên. Mở chương trình để gửi lại.')
        if (invited === 'nobody') message.warning({ duration: 8, content: 'Chưa mời được ai: các ca đoàn phục vụ chưa có ca viên nào để mời. Quản trị viên thêm ca viên vào ca đoàn ở trang Ca đoàn.' })
        saved.current = true
        navigate(generatePath(paths.priest.programDetail, { programId: event.id }))
      },
      // The form keeps its values so nothing is lost.
      onError: (error) => message.error(eventErrorMessage(error, 'Không thể lưu chương trình. Vui lòng thử lại.')),
      onSettled: () => setSubmitMode(null),
    })
  }

  return (
    <>
      <PageHeader
        title="Tạo chương trình"
        breadcrumb={[
          { title: 'Cha xứ' },
          { title: <Link to={paths.priest.programs}>Chương trình phụng vụ</Link> },
          { title: 'Tạo chương trình' },
        ]}
        description="Lưu bản nháp để công bố sau, hoặc tạo và công bố ngay."
      />
      {/* A long form on its own page with a short summary on the right third (artifact PriestCreateProgram). */}
      <div className="hm-split priest-create">
        <section className="hm-sheet-section priest-form" aria-label="Thông tin sự kiện">
          <EventForm
            formId={formId}
            hideActions
            publishRef={publishRef}
            initialDate={initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : undefined}
            saving={create.isPending}
            onSubmit={handleSubmit}
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
            <li>Công bố cần có mùa phụng vụ. Để trống, hệ thống ưu tiên điền mùa từ lịch phụng vụ đã đồng bộ (gồm lễ vọng).</li>
            <li>Khi công bố, Ca trưởng nhận thông báo và ca viên của các ca đoàn phục vụ được mời xác nhận tham gia.</li>
          </ul>
          {/* The draft button comes first in the DOM: Enter in a field submits with the form's first submit button, so
              it always saves a draft. The aside is sticky (global.css .hm-preview), so the actions stay in view. */}
          <Flex vertical gap={spacing.sm} style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md }}>
            <Button
              block
              htmlType="submit"
              form={formId}
              loading={create.isPending && submitMode === 'draft'}
              disabled={create.isPending && submitMode === 'publish'}
              onClick={() => {
                publishRef.current = false
              }}
            >
              Lưu bản nháp
            </Button>
            <Button
              block
              type="primary"
              htmlType="submit"
              form={formId}
              loading={create.isPending && submitMode === 'publish'}
              disabled={create.isPending && submitMode === 'draft'}
              onClick={() => {
                publishRef.current = true
              }}
            >
              Tạo và công bố
            </Button>
            <Button block htmlType="button" disabled={create.isPending} onClick={() => navigate(paths.priest.programs)}>
              {CANCEL_LABEL}
            </Button>
          </Flex>
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
