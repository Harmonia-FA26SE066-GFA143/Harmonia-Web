import { Alert, App, Button, Card, Flex, Input, Select, Switch, Table, TimePicker, Typography, type RefSelectProps } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useRef, useState } from 'react'
import { ApiError } from '@/lib/api/errors'
import {
  ACTIONS_COLUMN_TITLE,
  EmptyCell,
  EmptyState,
  ErrorState,
  FilterBar,
  filterAllPlaceholder,
  Form,
  FormDrawer,
  Icon,
  NoFilterResults,
  SectionSkeleton,
  SELECT_POPUP_PROPS,
  StatusTag,
} from '@/shared/ui'
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

type DrawerState = { open: false } | { open: true; schedule?: MassSchedule }

const muted = (text: string) => <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>

/** A lookup name in the table: while the list loads or after it failed the name is unknown, not absent. */
function lookupCell(query: { status: 'pending' | 'error' | 'success'; data?: CatalogEntry[] }, id: string) {
  const name = query.data?.find((entry) => entry.id === id)?.name
  if (name) return name
  if (query.status === 'pending') return muted('Đang tải…')
  if (query.status === 'error') return muted('Chưa tải được')
  return <EmptyCell />
}

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
  const [drawer, setDrawer] = useState<DrawerState>({ open: false })
  const [dayFilter, setDayFilter] = useState<DayOfWeek>()
  const [activeFilter, setActiveFilter] = useState<boolean>()
  const editing = drawer.open ? drawer.schedule : undefined
  const dayOfWeekRef = useRef<RefSelectProps>(null)
  const lookupFailed = massTypes.isError || locations.isError

  const visible = useMemo(
    () =>
      (schedules.data ?? []).filter(
        (schedule) =>
          (!dayFilter || schedule.dayOfWeek === dayFilter) &&
          (activeFilter === undefined || schedule.isActive === activeFilter),
      ),
    [schedules.data, dayFilter, activeFilter],
  )
  const hasFilters = Boolean(dayFilter || activeFilter !== undefined)
  const resetFilters = () => {
    setDayFilter(undefined)
    setActiveFilter(undefined)
  }

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
          setDrawer({ open: false })
        },
        // The drawer stays open so the entered values are not lost.
        onError: (error) =>
          message.error(
            (error instanceof ApiError && error.code && messages[error.code]) || 'Không thể lưu giờ lễ cố định. Vui lòng thử lại.',
          ),
      },
    )
  }

  const addButton = (
    <Button type="primary" icon={<Icon name="add" />} onClick={() => setDrawer({ open: true })}>
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
      <Flex vertical gap={spacing.md}>
        <FilterBar
          resultCount={visible.length}
          resultNoun="giờ lễ"
          hasActiveFilters={hasFilters}
          onReset={resetFilters}
          extra={addButton}
        >
          <Select
            {...SELECT_POPUP_PROPS}
            allowClear
            aria-label="Lọc theo thứ"
            placeholder={filterAllPlaceholder('thứ')}
            value={dayFilter}
            onChange={(value?: DayOfWeek) => setDayFilter(value)}
            options={dayOptions}
            style={{ minWidth: 156 }}
          />
          <Select
            {...SELECT_POPUP_PROPS}
            allowClear
            aria-label="Lọc theo trạng thái"
            placeholder={filterAllPlaceholder('trạng thái')}
            value={activeFilter}
            onChange={(value?: boolean) => setActiveFilter(value)}
            options={[
              { value: true, label: 'Đang dùng' },
              { value: false, label: 'Ngừng dùng' },
            ]}
            style={{ minWidth: 164 }}
          />
        </FilterBar>
        <Typography.Text style={{ color: colors.textMuted }}>
          Cha xứ tạo sự kiện nháp từ các giờ lễ đang dùng. Sửa giờ lễ không đổi các sự kiện đã tạo trước đó.
        </Typography.Text>
        <Card styles={{ body: { padding: 0 } }}>
          {visible.length === 0 ? (
            <div style={{ padding: spacing.md }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <Table<MassSchedule>
              rowKey="id"
              dataSource={visible}
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
              scroll={{ x: 'max-content' }}
              columns={[
                { key: 'day', title: 'Thứ', render: (_, schedule) => <Typography.Text strong>{dayOfWeekLabels[schedule.dayOfWeek]}</Typography.Text> },
                { key: 'time', title: 'Giờ', dataIndex: 'time' },
                { key: 'title', title: 'Tiêu đề', render: (_, schedule) => schedule.title ?? <EmptyCell text="Không có" /> },
                { key: 'massType', title: 'Loại Thánh lễ', render: (_, schedule) => lookupCell(massTypes, schedule.massTypeId) },
                { key: 'location', title: 'Nơi cử hành', render: (_, schedule) => lookupCell(locations, schedule.locationId) },
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
                  title: ACTIONS_COLUMN_TITLE,
                  align: 'center',
                  width: 128,
                  fixed: 'right',
                  render: (_, schedule) => (
                    <Button
                      icon={<Icon name="edit" />}
                      onClick={() => setDrawer({ open: true, schedule })}
                      aria-label={`Chỉnh sửa giờ lễ ${dayOfWeekLabels[schedule.dayOfWeek]} ${schedule.time}`}
                    >
                      Chỉnh sửa
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </Card>
      </Flex>
    )

  return (
    <>
      {content}
      <FormDrawer
        open={drawer.open}
        title={editing ? 'Chỉnh sửa giờ lễ cố định' : 'Thêm giờ lễ cố định'}
        okText={editing ? 'Lưu thay đổi' : 'Thêm'}
        initialFocusRef={dayOfWeekRef}
        okButtonProps={{
          htmlType: 'submit',
          loading: save.isPending,
          disabled: massTypes.isPending || locations.isPending || lookupFailed,
        }}
        cancelButtonProps={{ disabled: save.isPending }}
        onCancel={() => setDrawer({ open: false })}
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
        {lookupFailed && (
          <Alert
            type="error"
            showIcon
            title="Không tải được danh sách loại Thánh lễ hoặc nơi cử hành."
            action={
              <Button
                size="small"
                loading={massTypes.isFetching || locations.isFetching}
                onClick={() => {
                  if (massTypes.isError) massTypes.refetch()
                  if (locations.isError) locations.refetch()
                }}
              >
                Thử lại
              </Button>
            }
            style={{ marginBottom: spacing.md }}
          />
        )}
        <Flex gap={spacing.md} wrap>
          <Form.Item label="Thứ" name="dayOfWeek" rules={[{ required: true, message: 'Vui lòng chọn thứ.' }]} style={{ flex: '1 1 160px' }}>
            <Select {...SELECT_POPUP_PROPS} ref={dayOfWeekRef} options={dayOptions} />
          </Form.Item>
          <Form.Item label="Giờ" name="time" rules={[{ required: true, message: 'Vui lòng chọn giờ.' }]} style={{ flex: '1 1 160px' }}>
            <TimePicker {...SELECT_POPUP_PROPS} format="HH:mm" minuteStep={5} placeholder="Chọn giờ" style={{ width: '100%' }} />
          </Form.Item>
        </Flex>
        <Form.Item label="Loại Thánh lễ" name="massTypeId" rules={[{ required: true, message: 'Vui lòng chọn loại Thánh lễ.' }]}>
          <Select
            {...SELECT_POPUP_PROPS}
            showSearch
            optionFilterProp="label"
            placeholder="Chọn loại Thánh lễ"
            loading={massTypes.isPending}
            disabled={massTypes.isPending || massTypes.isError}
            notFoundContent={massTypes.isError ? 'Không tải được danh sách loại Thánh lễ.' : undefined}
            options={optionsOf(massTypes.data, editing?.massTypeId)}
          />
        </Form.Item>
        <Form.Item label="Nơi cử hành" name="locationId" rules={[{ required: true, message: 'Vui lòng chọn nơi cử hành.' }]}>
          <Select
            {...SELECT_POPUP_PROPS}
            showSearch
            optionFilterProp="label"
            placeholder="Chọn nơi cử hành"
            loading={locations.isPending}
            disabled={locations.isPending || locations.isError}
            notFoundContent={locations.isError ? 'Không tải được danh sách nơi cử hành.' : undefined}
            options={optionsOf(locations.data, editing?.locationId)}
          />
        </Form.Item>
        <Form.Item
          label="Tiêu đề"
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
