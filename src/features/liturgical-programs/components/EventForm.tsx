import { Button, DatePicker, Flex, Input, Select, TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useRef, type MutableRefObject } from 'react'
import { choirOptionLabel, useChoirs } from '@/features/choirs'
import { useCatalogOptions } from '@/features/system-categories'
import { spacing } from '@/styles/tokens'
import type { EventFormValues, LiturgicalEvent } from '../types'
import { CANCEL_LABEL, Form, SELECT_POPUP_PROPS } from '@/shared/ui'

interface FormFields {
  date?: Dayjs
  time?: Dayjs
  locationId?: string
  categoryId?: string
  title?: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  specialRequirements?: string
  choirIds?: string[]
  leadChoirId?: string
}

export interface EventFormProps {
  /** The event being edited; absent when creating one. */
  event?: LiturgicalEvent
  /** Preselected date (YYYY-MM-DD) when creating, e.g. from the calendar. */
  initialDate?: string
  saving?: boolean
  /** Required unless `hideActions`. */
  submitText?: string
  /** Create only: a second button that saves and publishes at once (BE 69c9d47). */
  publishText?: string
  onSubmit: (values: EventFormValues) => void
  /** Required unless `hideActions`. */
  onCancel?: () => void
  /** Called on the first edit, so the page can warn before leaving with unsaved input. */
  onDirty?: () => void
  /** `id` of the form, so buttons outside it (`form={formId}`) submit it. */
  formId?: string
  /** The page or drawer draws the buttons itself. */
  hideActions?: boolean
  /** Set by the outside "save and publish" button; the form keeps its own when omitted. */
  publishRef?: MutableRefObject<boolean>
}

const toFields = (event: LiturgicalEvent): FormFields => ({
  date: dayjs(event.date),
  time: dayjs(`${event.date}T${event.time}`),
  locationId: event.locationId,
  categoryId: event.categoryId,
  title: event.title,
  seasonId: event.seasonId,
  massTypeId: event.massTypeId,
  ceremonyTypeId: event.ceremonyTypeId,
  specialRequirements: event.specialRequirements,
})

const startOf = (date: Dayjs, time: Dayjs) => date.hour(time.hour()).minute(time.minute()).second(0)

/** On today, the hours and minutes already gone; any other day keeps every time (an earlier day cannot be picked). */
const pastTimes = (date?: Dayjs) => {
  const now = dayjs()
  if (!date?.isSame(now, 'day')) return {}
  return {
    disabledHours: () => Array.from({ length: now.hour() }, (_, hour) => hour),
    disabledMinutes: (hour: number) => (hour === now.hour() ? Array.from({ length: now.minute() + 1 }, (_, minute) => minute) : []),
  }
}

// Only the Admin edits the catalogs; an empty list says where they are kept instead of antd's bare "no data".
const emptyCatalog = 'Chưa có mục nào. Quản trị viên thêm ở Danh mục phụng vụ.'

/**
 * Event fields with the backend's rules (Create/UpdateLiturgicalEventRequestValidator): date, time and place are
 * required, and a Mass type or a ceremony type. Shared by the create page and the edit dialog. Creating also needs
 * the serving choirs and the lead one (BE 678fc34); once created, they change on the event's choir card.
 */
export function EventForm({
  event,
  initialDate,
  saving = false,
  submitText,
  publishText,
  onSubmit,
  onCancel,
  onDirty,
  formId,
  hideActions = false,
  publishRef,
}: Readonly<EventFormProps>) {
  const [form] = Form.useForm<FormFields>()
  // Which button submitted: the plain save or "save and publish". Read once validation passes, then reset (also on a
  // failed validation), so a later Enter in a field never publishes.
  const ownPublishRef = useRef(false)
  const publishing = publishRef ?? ownPublishRef
  const chosenChoirIds = Form.useWatch('choirIds', form) ?? []
  const choirs = useChoirs(!event)
  const choirOptions = (choirs.data ?? []).filter((choir) => choir.isActive).map((choir) => ({ value: choir.id, label: choirOptionLabel(choir) }))
  const locations = useCatalogOptions('worshipLocations')
  const categories = useCatalogOptions('eventCategories')
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')

  const handleFinish = (values: FormFields) => {
    const isPublished = publishing.current
    publishing.current = false
    if (saving) return
    onSubmit({
      date: values.date?.format('YYYY-MM-DD') ?? '',
      time: values.time?.format('HH:mm') ?? '',
      locationId: values.locationId ?? '',
      categoryId: values.categoryId,
      title: values.title?.trim() || undefined,
      seasonId: values.seasonId,
      massTypeId: values.massTypeId,
      ceremonyTypeId: values.ceremonyTypeId,
      specialRequirements: values.specialRequirements?.trim() || undefined,
      ...(event ? {} : { choirIds: values.choirIds, leadChoirId: values.leadChoirId, isPublished }),
    })
  }

  // A parish with one active choir has nothing to choose: it serves and leads, and the Priest may still change it.
  const onlyChoirId = !event && choirOptions.length === 1 ? choirOptions[0].value : undefined
  useEffect(() => {
    if (onlyChoirId && !form.isFieldTouched('choirIds')) form.setFieldsValue({ choirIds: [onlyChoirId], leadChoirId: onlyChoirId })
  }, [onlyChoirId, form])

  // Keeps the lead among the chosen choirs, and picks the only one when a single choir serves.
  const chooseChoirs = (choirIds: string[]) => {
    const lead = form.getFieldValue('leadChoirId') as string | undefined
    form.setFieldValue('leadChoirId', lead && choirIds.includes(lead) ? lead : choirIds.length === 1 ? choirIds[0] : undefined)
  }

  return (
    <Form<FormFields>
      id={formId}
      form={form}
      layout="vertical"
      initialValues={event ? toFields(event) : { date: initialDate ? dayjs(initialDate) : undefined }}
      onValuesChange={onDirty}
      onFinish={handleFinish}
      onFinishFailed={() => {
        publishing.current = false
      }}
      style={{ maxWidth: 720 }}
    >
      {/* Grouped under rubrics (artifact PriestCreateProgram). */}
      <h2 className="hm-rubric">Thời gian và nơi</h2>
      <Flex wrap gap={spacing.md}>
        <Form.Item
          label="Ngày cử hành"
          name="date"
          rules={[{ required: true, message: 'Vui lòng chọn ngày cử hành.' }]}
          style={{ flex: '1 1 200px' }}
        >
          <DatePicker {...SELECT_POPUP_PROPS} format="DD/MM/YYYY" placeholder="Chọn ngày" disabledDate={(day) => day.isBefore(dayjs(), 'day')} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Giờ"
          name="time"
          dependencies={['date']}
          rules={[
            { required: true, message: 'Vui lòng chọn giờ.' },
            // BE refuses a date and time already passed (LiturgicalEventService.cs:64, 151, 335: LITURGICAL_EVENT_ALREADY_PASSED).
            ({ getFieldValue }) => ({
              validator: (_, time?: Dayjs) => {
                const date = getFieldValue('date') as Dayjs | undefined
                return !date || !time || startOf(date, time).isAfter(dayjs())
                  ? Promise.resolve()
                  : Promise.reject(new Error('Ngày giờ cử hành đã qua. Vui lòng chọn thời điểm sắp tới.'))
              },
            }),
          ]}
          style={{ flex: '1 1 140px' }}
        >
          <TimePicker {...SELECT_POPUP_PROPS} format="HH:mm" minuteStep={5} placeholder="Chọn giờ" disabledTime={() => pastTimes(form.getFieldValue('date'))} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Nơi cử hành"
          name="locationId"
          rules={[{ required: true, message: 'Vui lòng chọn nơi cử hành.' }]}
          style={{ flex: '2 1 240px' }}
        >
          <Select {...SELECT_POPUP_PROPS} placeholder="Chọn nơi cử hành" options={locations} notFoundContent={emptyCatalog} />
        </Form.Item>
      </Flex>
      <h2 className="hm-rubric">Phụng vụ</h2>
      <Flex wrap gap={spacing.md}>
        <Form.Item
          label="Loại Thánh lễ"
          name="massTypeId"
          dependencies={['ceremonyTypeId']}
          rules={[
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                value || getFieldValue('ceremonyTypeId')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Chọn loại Thánh lễ hoặc loại nghi thức.')),
            }),
          ]}
          style={{ flex: '1 1 200px' }}
        >
          <Select {...SELECT_POPUP_PROPS} allowClear placeholder="Chọn loại Thánh lễ" options={massTypes} notFoundContent={emptyCatalog} />
        </Form.Item>
        <Form.Item label="Loại nghi thức" name="ceremonyTypeId" style={{ flex: '1 1 200px' }}>
          <Select {...SELECT_POPUP_PROPS} allowClear placeholder="Chọn loại nghi thức" options={ceremonyTypes} notFoundContent={emptyCatalog} />
        </Form.Item>
      </Flex>
      <Flex wrap gap={spacing.md}>
        <Form.Item
          label="Mùa phụng vụ"
          name="seasonId"
          extra={
            event
              ? undefined
              : 'Để trống thì hệ thống ưu tiên điền mùa từ lịch phụng vụ đã đồng bộ (gồm lễ vọng), hoặc theo khoảng ngày của danh mục mùa.'
          }
          style={{ flex: '1 1 200px' }}
        >
          <Select {...SELECT_POPUP_PROPS} allowClear placeholder="Chọn mùa phụng vụ" options={seasons} notFoundContent={emptyCatalog} />
        </Form.Item>
        <Form.Item label="Loại sự kiện" name="categoryId" style={{ flex: '1 1 200px' }}>
          <Select {...SELECT_POPUP_PROPS} allowClear placeholder="Chọn loại sự kiện" options={categories} notFoundContent={emptyCatalog} />
        </Form.Item>
      </Flex>
      <Form.Item
        label="Tiêu đề"
        name="title"
        rules={[{ max: 200, message: 'Tiêu đề tối đa 200 ký tự.' }]}
      >
        <Input placeholder="Ví dụ: Thánh lễ Chúa Nhật tuần XXVI Thường Niên" />
      </Form.Item>
      {!event && <h2 className="hm-rubric">Ca đoàn phục vụ</h2>}
      {!event && (
        <Flex wrap gap={spacing.md}>
          <Form.Item
            label="Ca đoàn phục vụ"
            name="choirIds"
            rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một ca đoàn phục vụ.' }]}
            extra={choirs.isError ? 'Không thể tải danh sách ca đoàn. Vui lòng tải lại trang.' : undefined}
            style={{ flex: '2 1 280px' }}
          >
            <Select
              {...SELECT_POPUP_PROPS}
              mode="multiple"
              optionFilterProp="label"
              placeholder="Chọn ca đoàn"
              loading={choirs.isPending}
              options={choirOptions}
              notFoundContent="Chưa có ca đoàn đang hoạt động. Quản trị viên thêm ở trang Ca đoàn."
              onChange={chooseChoirs}
            />
          </Form.Item>
          <Form.Item
            label="Ca đoàn phụ trách"
            name="leadChoirId"
            rules={[{ required: true, message: 'Chọn ca đoàn phụ trách.' }]}
            extra="Ca trưởng của ca đoàn này lập danh sách bài, mời tham gia và phân công."
            style={{ flex: '1 1 200px' }}
          >
            <Select
              {...SELECT_POPUP_PROPS}
              placeholder="Chọn ca đoàn phụ trách"
              disabled={chosenChoirIds.length === 0}
              options={choirOptions.filter(({ value }) => chosenChoirIds.includes(value))}
            />
          </Form.Item>
        </Flex>
      )}
      <h2 className="hm-rubric">Ghi chú</h2>
      <Form.Item
        label="Yêu cầu đặc biệt"
        name="specialRequirements"
        rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}
      >
        <Input.TextArea rows={4} showCount maxLength={1000} />
      </Form.Item>
      {!hideActions && (
      <Flex justify="flex-end" gap={spacing.sm}>
        <Button onClick={onCancel}>{CANCEL_LABEL}</Button>
        {publishText && !event ? (
          <>
            <Button htmlType="submit" loading={saving} onClick={() => (publishing.current = false)}>
              {submitText}
            </Button>
            <Button type="primary" htmlType="submit" loading={saving} onClick={() => (publishing.current = true)}>
              {publishText}
            </Button>
          </>
        ) : (
          <Button type="primary" htmlType="submit" loading={saving}>
            {submitText}
          </Button>
        )}
      </Flex>
      )}
    </Form>
  )
}
