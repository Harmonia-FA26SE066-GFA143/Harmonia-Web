import { Button, Card, DatePicker, Flex, Form, Input, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCatalogOptions } from '@/features/system-categories'
import { spacing } from '@/styles/tokens'
import type { ProgramFormValues } from '../types'

interface FormFields {
  eventName: string
  date?: Dayjs
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  specialRequirements?: string
}

export interface ProgramFormProps {
  /** Preselected celebration date (YYYY-MM-DD), e.g. when coming from the calendar. */
  initialDate?: string
  saving?: boolean
  onSubmit: (values: ProgramFormValues) => void
  onCancel: () => void
  /** Called on the first edit, so the page can warn before leaving with unsaved input. */
  onDirty: () => void
}

/**
 * FE-16 event fields. Requiredness and validation are UNRESOLVED (open-business-decisions.md, Events and
 * Programs): only the event name and date are required, as the minimum for a usable program (TBD).
 */
export function ProgramForm({ initialDate, saving = false, onSubmit, onCancel, onDirty }: ProgramFormProps) {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')

  const handleFinish = (values: FormFields) =>
    onSubmit({
      eventName: values.eventName.trim(),
      date: values.date?.format('YYYY-MM-DD') ?? '',
      seasonId: values.seasonId,
      massTypeId: values.massTypeId,
      ceremonyTypeId: values.ceremonyTypeId,
      specialRequirements: values.specialRequirements?.trim() || undefined,
    })

  return (
    <Card>
      <Form<FormFields>
        layout="vertical"
        disabled={saving}
        initialValues={{ date: initialDate ? dayjs(initialDate) : undefined }}
        onValuesChange={onDirty}
        onFinish={handleFinish}
        style={{ maxWidth: 720 }}
      >
        <Form.Item
          label="Tên sự kiện"
          name="eventName"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên sự kiện.' }]}
        >
          <Input placeholder="Ví dụ: Thánh lễ Chúa Nhật tuần XXVI Thường Niên" />
        </Form.Item>
        <Form.Item label="Ngày cử hành" name="date" rules={[{ required: true, message: 'Vui lòng chọn ngày cử hành.' }]}>
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%', maxWidth: 240 }} />
        </Form.Item>
        <Flex wrap gap={spacing.md}>
          <Form.Item label="Mùa phụng vụ" name="seasonId" style={{ flex: '1 1 200px' }}>
            <Select allowClear placeholder="Chọn mùa phụng vụ" options={seasons} />
          </Form.Item>
          <Form.Item label="Loại Thánh lễ" name="massTypeId" style={{ flex: '1 1 200px' }}>
            <Select allowClear placeholder="Chọn loại Thánh lễ" options={massTypes} />
          </Form.Item>
          <Form.Item label="Loại nghi thức" name="ceremonyTypeId" style={{ flex: '1 1 200px' }}>
            <Select allowClear placeholder="Chọn loại nghi thức" options={ceremonyTypes} />
          </Form.Item>
        </Flex>
        <Form.Item label="Yêu cầu đặc biệt (không bắt buộc)" name="specialRequirements">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Flex justify="flex-end" gap={spacing.sm}>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Lưu chương trình
          </Button>
        </Flex>
      </Form>
    </Card>
  )
}
