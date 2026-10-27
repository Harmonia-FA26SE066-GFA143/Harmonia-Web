import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Form, Input, Select, Switch, Table, TimePicker, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { ApiError } from '@/lib/api/errors'
import { EmptyState, ErrorState, FormDrawer, SectionSkeleton, StatusTag } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useCatalogItems, useLocations, useMassSchedules, useSaveMassSchedule } from '../hooks/useCatalogs'
import { dayOfWeekLabels, type CatalogEntry, type DayOfWeek, type MassSchedule, type MassScheduleValues } from '../types'

/** Refusals of POST / PUT /api/mass-schedules (Harmonia-BE MassScheduleService). */
const messages: Record<string, string> = {
  MASS_SCHEDULE_SLOT_TAKEN: 'Đã có giờ lễ cố định khác cùng thứ, giờ và nơi cử hành.',
  MASS_SCHEDULE_NOT_FOUND: 'Giờ lễ này không còn tồn tại. Vui lòng tải lại trang.',
  LOOKUP_INACTIVE: 'Loại Thánh lễ hoặc nơi cử hành đã chọn đã ngừng dùng.',
  LOOKUP_NOT_FOUND: 'Loại Thánh lễ hoặc nơi cử hành đã chọn không còn tồn tại. Vui lòng tải lại trang.',
}

const dayOptions = Object.entries(dayOfWeekLabels).map(([value, label]) => ({ value, label }))

interface FormValues {
  dayOfWeek: DayOfWeek
  time: Dayjs
  massTypeId: string
  locationId: string
  title?: string
  isActive: boolean
}

/** Active entries to choose from, plus the one already chosen even if switched off since (the backend keeps it). */
const optionsOf = (entries: CatalogEntry[] | undefined, current?: string) =>
  (entries ?? []).filter((entry) => entry.isActive || entry.id === current).map(({ id, name }) => ({ value: id, label: name }))

type ModalState = { open: false } | { open: true; schedule?: MassSchedule }

/**
 * Admin: the parish's fixed weekly Mass times (`api/mass-schedules`). The Parish Priest generates draft events from the
 * active ones; changing a schedule does not touch events generated before.
 */
export function MassSchedulesPanel() {
  const { message } = App.useApp()
  const schedules = useMassSchedules()
  const massTypes = useCatalogItems('massTypes')
  const locations = useLocations()
  const save = useSaveMassSchedule()
  const [modal, setModal] = useState<ModalState>({ open: false })
  const editing = modal.open ? modal.schedule : undefined

  const nameIn = (entries: CatalogEntry[] | undefined, id: string) => entries?.find((entry) => entry.id === id)?.name ?? '—'

  const submit = (values: FormValues) => {
    if (save.isPending) return
    const body: MassScheduleValues = {
      dayOfWeek: values.dayOfWeek,
      time: values.time.format('HH:mm'),
      massTypeId: values.massTypeId,
      locationId: values.locationId,
      title: values.title ?? null,
      isActive: values.isActive,
    }
    save.mutate(
      { id: editing?.id, values: body },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu thay đổi.' : 'Đã thêm giờ lễ cố định.')
          setModal({ open: false })
        },
        // The modal stays open so the entered values are not lost.
        onError: (error) =>
          message.error(
            (error instanceof ApiError && error.code && messages[error.code]) || 'Không thể lưu giờ lễ cố định. Vui lòng thử lại.',
          ),
      },
    )
  }

  const addButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true })}>
      Thêm giờ lễ cố định
    </Button>
  )

  let content
  if (schedules.isPending) content = <SectionSkeleton rows={5} label="Đang tải giờ lễ cố định" />
  else if (schedules.isError)
    content = <ErrorState title="Không thể tải giờ lễ cố định" error={schedules.error} hasData={schedules.data !== undefined} onRetry={() => schedules.refetch()} retrying={schedules.isFetching} />
  else if (schedules.data.length === 0)
    content = (
      <EmptyState
        title="Chưa có giờ lễ cố định nào"
        description="Thêm các giờ lễ hằng tuần của giáo xứ (vd Chúa nhật 05:00, 07:00) để Cha xứ tạo nhanh sự kiện nháp."
        action={addButton}
      />
    )
  else
    content = (
      <Card styles={{ body: { padding: 0 } }}>
        <Flex justify="space-between" align="center" wrap gap={spacing.sm} style={{ padding: spacing.md }}>
          <Typography.Text style={{ color: colors.textMuted }}>
            Cha xứ tạo sự kiện nháp từ các giờ lễ đang dùng. Sửa giờ lễ không đổi các sự kiện đã tạo trước đó.
          </Typography.Text>
          {addButton}
        </Flex>
        <Table<MassSchedule>
          rowKey="id"
          dataSource={schedules.data}
          pagination={false}
          scroll={{ x: 'max-content' }}
          columns={[
            { key: 'day', title: 'Thứ', render: (_, schedule) => <Typography.Text strong>{dayOfWeekLabels[schedule.dayOfWeek]}</Typography.Text> },
            { key: 'time', title: 'Giờ', dataIndex: 'time' },
            { key: 'title', title: 'Tiêu đề', render: (_, schedule) => schedule.title ?? <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text> },
            { key: 'massType', title: 'Loại Thánh lễ', render: (_, schedule) => nameIn(massTypes.data, schedule.massTypeId) },
            { key: 'location', title: 'Nơi cử hành', render: (_, schedule) => nameIn(locations.data, schedule.locationId) },
            {
              key: 'status',
              title: 'Trạng thái',
              fixed: 'right',
              render: (_, schedule) => (
                <StatusTag color={schedule.isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
                  {schedule.isActive ? 'Đang dùng' : 'Ngừng dùng'}
                </StatusTag>
              ),
            },
            {
              key: 'actions',
              title: 'Thao tác',
              align: 'right',
              fixed: 'right',
              render: (_, schedule) => (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setModal({ open: true, schedule })}
                  aria-label={`Chỉnh sửa giờ lễ ${dayOfWeekLabels[schedule.dayOfWeek]} ${schedule.time}`}
                >
                  Chỉnh sửa
                </Button>
              ),
            },
          ]}
        />
      </Card>
    )

  return (
    <>
      {content}
      <FormDrawer
        open={modal.open}
        title={editing ? 'Chỉnh sửa giờ lễ cố định' : 'Thêm giờ lễ cố định'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm'}
        cancelText="Hủy"
        okButtonProps={{ htmlType: 'submit', loading: save.isPending }}
        cancelButtonProps={{ disabled: save.isPending }}
        onCancel={() => setModal({ open: false })}
        destroyOnHidden
        drawerRender={(dom) => (
          <Form<FormValues>
            layout="vertical"
            initialValues={
              editing
                ? { ...editing, time: dayjs(`2000-01-01T${editing.time}`), title: editing.title ?? undefined }
                : { dayOfWeek: 'Sunday', isActive: true }
            }
            onFinish={submit}
          >
            {dom}
          </Form>
        )}
      >
        <Flex gap={spacing.md} wrap>
          <Form.Item label="Thứ" name="dayOfWeek" rules={[{ required: true, message: 'Vui lòng chọn thứ.' }]} style={{ flex: '1 1 160px' }}>
            <Select options={dayOptions} />
          </Form.Item>
          <Form.Item label="Giờ" name="time" rules={[{ required: true, message: 'Vui lòng chọn giờ.' }]} style={{ flex: '1 1 160px' }}>
            <TimePicker format="HH:mm" minuteStep={5} placeholder="Chọn giờ" style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Form.Item label="Loại Thánh lễ" name="massTypeId" rules={[{ required: true, message: 'Vui lòng chọn loại Thánh lễ.' }]}>
          <Select showSearch optionFilterProp="label" placeholder="Chọn loại Thánh lễ" options={optionsOf(massTypes.data, editing?.massTypeId)} />
        </Form.Item>
        <Form.Item label="Nơi cử hành" name="locationId" rules={[{ required: true, message: 'Vui lòng chọn nơi cử hành.' }]}>
          <Select showSearch optionFilterProp="label" placeholder="Chọn nơi cử hành" options={optionsOf(locations.data, editing?.locationId)} />
        </Form.Item>
        <Form.Item
          label="Tiêu đề (không bắt buộc)"
          name="title"
          extra="Đặt làm tiêu đề cho sự kiện được tạo từ giờ lễ này, vd “Lễ sáng sớm”."
          rules={[{ max: 200, message: 'Tiêu đề tối đa 200 ký tự.' }]}
        >
          <Input maxLength={200} />
        </Form.Item>
        {editing && (
          <Form.Item label="Đang sử dụng" name="isActive" valuePropName="checked" extra="Giờ lễ ngừng dùng không còn được dùng để tạo sự kiện.">
            <Switch />
          </Form.Item>
        )}
      </FormDrawer>
    </>
  )
}
