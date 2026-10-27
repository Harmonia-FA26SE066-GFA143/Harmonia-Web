import { ThunderboltOutlined } from '@ant-design/icons'
import { Alert, App, Button, DatePicker, Flex, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { dayOfWeekLabels, useLookup, useMassSchedules } from '@/features/system-categories'
import { vietnamToday } from '@/lib/api/dates'
import { colors, spacing } from '@/styles/tokens'
import { eventErrorMessage } from '../eventErrors'
import { useGenerateEvents } from '../hooks/useEvents'
import { FormDrawer } from '@/shared/ui'

/** GenerateLiturgicalEventsRequestValidator.MaxDays: both ends count. */
const maxDays = 62

/**
 * Parish Priest: creates draft events for a date range from the fixed weekly Mass times the Admin keeps
 * (`POST /api/liturgical-events/generation`). Days already holding an event at that time and place are skipped, so
 * running it again is safe; nothing is sent to anyone.
 */
export function GenerateEventsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button icon={<ThunderboltOutlined />} onClick={() => setOpen(true)}>
        Tạo từ giờ lễ cố định
      </Button>
      {/* Mounted while open only, so the pages do not load the Mass times until they are needed. */}
      {open && <GenerateEventsDrawer onClose={() => setOpen(false)} />}
    </>
  )
}

function GenerateEventsDrawer({ onClose }: Readonly<{ onClose: () => void }>) {
  const { message } = App.useApp()
  const today = dayjs(vietnamToday())
  // Four weeks by default.
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([today, today.add(27, 'day')])
  const schedules = useMassSchedules()
  const massTypes = useLookup('massTypes').data
  const locations = useLookup('worshipLocations').data
  const generate = useGenerateEvents()
  const active = (schedules.data ?? []).filter((schedule) => schedule.isActive)
  const nameIn = (entries: { id: string; name: string }[] | undefined, id: string) => entries?.find((entry) => entry.id === id)?.name

  const submit = () => {
    if (!range || generate.isPending) return
    generate.mutate(
      { fromDate: range[0].format('YYYY-MM-DD'), toDate: range[1].format('YYYY-MM-DD') },
      {
        onSuccess: (created) => {
          if (created.length > 0) message.success(`Đã tạo ${created.length} sự kiện nháp.`)
          else message.info('Không có sự kiện mới: các giờ lễ trong khoảng này đã có sự kiện.')
          onClose()
        },
        onError: (error) => message.error(eventErrorMessage(error, 'Không thể tạo sự kiện. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <FormDrawer
      open
      title="Tạo sự kiện nháp từ giờ lễ cố định"
      okText="Tạo sự kiện nháp"
      cancelText="Hủy"
      okButtonProps={{ loading: generate.isPending, disabled: !range || active.length === 0 }}
      cancelButtonProps={{ disabled: generate.isPending }}
      onOk={submit}
      onCancel={onClose}
    >
      <Flex vertical gap={spacing.md}>
        <Typography.Paragraph style={{ margin: 0 }}>
          Mỗi ngày trong khoảng, mỗi giờ lễ đang dùng trùng thứ sẽ thành một sự kiện nháp. Giờ lễ đã có sự kiện thì bỏ qua.
          Mùa phụng vụ lấy theo ngày; sự kiện chưa có mùa cần chọn mùa trước khi công bố. Chưa ai nhận thông báo.
        </Typography.Paragraph>
        <Flex vertical gap={spacing.xs}>
          <Typography.Text strong>Khoảng ngày</Typography.Text>
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            value={range}
            allowClear={false}
            aria-label="Khoảng ngày tạo sự kiện"
            onChange={(value) => setRange(value?.[0] && value[1] ? [value[0], value[1]] : null)}
            disabledDate={(date, info) => {
              if (date.isBefore(today, 'day')) return true
              const from = info.from
              return Boolean(from && Math.abs(date.diff(from, 'day')) >= maxDays)
            }}
            style={{ width: '100%' }}
          />
          <Typography.Text style={{ color: colors.textMuted }}>Từ hôm nay, tối đa {maxDays} ngày.</Typography.Text>
        </Flex>
        {schedules.isPending && <Typography.Text style={{ color: colors.textMuted }}>Đang tải giờ lễ cố định…</Typography.Text>}
        {schedules.isError && <Alert type="error" showIcon title="Không thể tải giờ lễ cố định." />}
        {schedules.isSuccess && active.length === 0 && (
          <Alert
            type="warning"
            showIcon
            title="Chưa có giờ lễ cố định nào đang dùng"
            description="Quản trị viên thêm giờ lễ hằng tuần ở Danh mục phụng vụ › Giờ lễ cố định."
          />
        )}
        {active.length > 0 && (
          <div>
            <Typography.Text strong>Giờ lễ sẽ dùng ({active.length})</Typography.Text>
            <ul style={{ margin: `${spacing.xs}px 0 0`, paddingInlineStart: spacing.lg }}>
              {active.map((schedule) => (
                <li key={schedule.id}>
                  {[
                    dayOfWeekLabels[schedule.dayOfWeek],
                    schedule.time,
                    schedule.title ?? nameIn(massTypes, schedule.massTypeId),
                    nameIn(locations, schedule.locationId),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Flex>
    </FormDrawer>
  )
}
