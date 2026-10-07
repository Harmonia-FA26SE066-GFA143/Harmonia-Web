import { Button, DatePicker, Flex, Form, Input, Select, TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCatalogOptions } from '@/features/system-categories'
import { spacing } from '@/styles/tokens'
import type { EventFormValues, LiturgicalEvent } from '../types'

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
}

export interface EventFormProps {
  /** The event being edited; absent when creating one. */
  event?: LiturgicalEvent
  /** Preselected date (YYYY-MM-DD) when creating, e.g. from the calendar. */
  initialDate?: string
  saving?: boolean
  submitText: string
  onSubmit: (values: EventFormValues) => void
  onCancel: () => void
  /** Called on the first edit, so the page can warn before leaving with unsaved input. */
  onDirty?: () => void
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

/**
 * Event fields with the backend's rules (Create/UpdateLiturgicalEventRequestValidator): date, time and place are
 * required, and a Mass type or a ceremony type. Shared by the create page and the edit dialog.
 */
export function EventForm({ event, initialDate, saving = false, submitText, onSubmit, onCancel, onDirty }: EventFormProps) {
  const locations = useCatalogOptions('worshipLocations')
  const categories = useCatalogOptions('eventCategories')
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')

  const handleFinish = (values: FormFields) =>
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
    })

  return (
    <Form<FormFields>
      layout="vertical"
      disabled={saving}
      initialValues={event ? toFields(event) : { date: initialDate ? dayjs(initialDate) : undefined }}
      onValuesChange={onDirty}
      onFinish={handleFinish}
      style={{ maxWidth: 720 }}
    >
      <Flex wrap gap={spacing.md}>
        <Form.Item
          label="Ngày cử hành"
          name="date"
          rules={[{ required: true, message: 'Vui lòng chọn ngày cử hành.' }]}
          style={{ flex: '1 1 200px' }}
        >
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Giờ" name="time" rules={[{ required: true, message: 'Vui lòng chọn giờ.' }]} style={{ flex: '1 1 140px' }}>
          <TimePicker format="HH:mm" minuteStep={5} placeholder="Chọn giờ" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Nơi cử hành"
          name="locationId"
          rules={[{ required: true, message: 'Vui lòng chọn nơi cử hành.' }]}
          style={{ flex: '2 1 240px' }}
        >
          <Select placeholder="Chọn nơi cử hành" options={locations} />
        </Form.Item>
      </Flex>
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
          <Select allowClear placeholder="Chọn loại Thánh lễ" options={massTypes} />
        </Form.Item>
        <Form.Item label="Loại nghi thức" name="ceremonyTypeId" style={{ flex: '1 1 200px' }}>
          <Select allowClear placeholder="Chọn loại nghi thức" options={ceremonyTypes} />
        </Form.Item>
      </Flex>
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Mùa phụng vụ" name="seasonId" style={{ flex: '1 1 200px' }}>
          <Select allowClear placeholder="Chọn mùa phụng vụ" options={seasons} />
        </Form.Item>
        <Form.Item label="Loại sự kiện" name="categoryId" style={{ flex: '1 1 200px' }}>
          <Select allowClear placeholder="Chọn loại sự kiện" options={categories} />
        </Form.Item>
      </Flex>
      <Form.Item
        label="Tiêu đề (không bắt buộc)"
        name="title"
        rules={[{ max: 200, message: 'Tiêu đề tối đa 200 ký tự.' }]}
      >
        <Input placeholder="Ví dụ: Thánh lễ Chúa Nhật tuần XXVI Thường Niên" />
      </Form.Item>
      <Form.Item
        label="Yêu cầu đặc biệt (không bắt buộc)"
        name="specialRequirements"
        rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}
      >
        <Input.TextArea rows={4} showCount maxLength={1000} />
      </Form.Item>
      <Flex justify="flex-end" gap={spacing.sm}>
        <Button onClick={onCancel}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          {submitText}
        </Button>
      </Flex>
    </Form>
  )
}
