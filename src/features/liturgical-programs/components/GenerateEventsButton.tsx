import { Alert, App, Button, DatePicker, Flex, Select, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useRef, useState, type ComponentRef } from 'react'
import { choirOptionLabel, useChoirs } from '@/features/choirs'
import { dayOfWeekLabels, useLookup, useMassSchedules } from '@/features/system-categories'
import { vietnamToday } from '@/lib/api/dates'
import { colors, spacing } from '@/styles/tokens'
import { eventErrorMessage } from '../eventErrors'
import { useGenerateEvents } from '../hooks/useEvents'
import { FormDrawer, Icon, SELECT_POPUP_PROPS } from '@/shared/ui'

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
      <Button icon={<Icon name="calendar" />} onClick={() => setOpen(true)}>
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
  const rangeRef = useRef<ComponentRef<typeof DatePicker.RangePicker>>(null)
  const choirsQuery = useChoirs()
  // A failed or loading choir list never sends drafts without choirs by accident: the submit waits for it.
  const choirsBlocked = choirsQuery.isPending || choirsQuery.isError
  const choirs = (choirsQuery.data ?? []).filter((choir) => choir.isActive)
  // Untouched, the only active choir is taken; the Priest may clear it.
  const [pickedChoirIds, setPickedChoirIds] = useState<string[]>()
  const [pickedLeadId, setPickedLeadId] = useState<string>()
  const choirIds = pickedChoirIds ?? (choirs.length === 1 ? [choirs[0].id] : [])
  const leadChoirId = pickedLeadId && choirIds.includes(pickedLeadId) ? pickedLeadId : choirIds[0]
  const active = (schedules.data ?? []).filter((schedule) => schedule.isActive)
  const nameIn = (entries: { id: string; name: string }[] | undefined, id: string) => entries?.find((entry) => entry.id === id)?.name

  const submit = () => {
    if (!range || generate.isPending) return
    generate.mutate(
      { fromDate: range[0].format('YYYY-MM-DD'), toDate: range[1].format('YYYY-MM-DD'), choirs: { choirIds, leadChoirId } },
      {
        onSuccess: ({ created }) => {
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
      okButtonProps={{ loading: generate.isPending, disabled: !range || active.length === 0 || choirsBlocked }}
      cancelButtonProps={{ disabled: generate.isPending }}
      onOk={submit}
      onCancel={onClose}
      initialFocusRef={rangeRef}
    >
      <Flex vertical gap={spacing.md}>
        <Typography.Paragraph style={{ margin: 0 }}>
          Mỗi ngày trong khoảng, mỗi giờ lễ đang dùng trùng thứ sẽ thành một sự kiện nháp. Giờ lễ đã có sự kiện thì bỏ qua.
          Mùa phụng vụ lấy theo ngày; sự kiện chưa có mùa cần chọn mùa trước khi công bố. Chưa ai nhận thông báo.
        </Typography.Paragraph>
        <Flex vertical gap={spacing.xs}>
          <Typography.Text strong>Khoảng ngày</Typography.Text>
          {/* The two-month popup (~560px) stays on the body: inside the 480px drawer it would be clipped. */}
          <DatePicker.RangePicker
            ref={rangeRef}
            placement="bottomLeft"
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
          <div className="hm-quick-picks">
            <Button size="small" type="dashed" onClick={() => setRange([today, today.add(27, 'day')])}>
              4 tuần tới
            </Button>
            <Button
              size="small"
              type="dashed"
              onClick={() => {
                const start = today.add(1, 'month').startOf('month')
                setRange([start, start.endOf('month')])
              }}
            >
              Tháng sau
            </Button>
            <Button size="small" type="dashed" onClick={() => setRange([today, today.add(maxDays - 1, 'day')])}>
              Tối đa {maxDays} ngày
            </Button>
          </div>
          <Typography.Text style={{ color: colors.textMuted }}>Từ hôm nay, tối đa {maxDays} ngày.</Typography.Text>
        </Flex>
        <Flex vertical gap={spacing.xs}>
          <Typography.Text strong>Ca đoàn phục vụ</Typography.Text>
          <Select
            {...SELECT_POPUP_PROPS}
            mode="multiple"
            loading={choirsQuery.isPending}
            disabled={choirsBlocked}
            allowClear
            aria-label="Ca đoàn phục vụ"
            placeholder="Chọn sau trong từng sự kiện"
            value={choirIds}
            onChange={setPickedChoirIds}
            options={choirs.map((choir) => ({ value: choir.id, label: choirOptionLabel(choir) }))}
            optionFilterProp="label"
          />
          {choirIds.length > 1 && (
            <Select
              {...SELECT_POPUP_PROPS}
              aria-label="Ca đoàn phụ trách"
              value={leadChoirId}
              onChange={setPickedLeadId}
              options={choirs.filter((choir) => choirIds.includes(choir.id)).map((choir) => ({ value: choir.id, label: `Phụ trách: ${choirOptionLabel(choir)}` }))}
            />
          )}
          {choirsQuery.isError && (
            <Alert
              type="error"
              showIcon
              title="Không thể tải danh sách ca đoàn."
              action={
                <Button size="small" onClick={() => choirsQuery.refetch()} loading={choirsQuery.isFetching}>
                  Thử lại
                </Button>
              }
            />
          )}
          <Typography.Text style={{ color: colors.textMuted }}>
            Gán cho mọi sự kiện mới tạo. Sự kiện chưa có ca đoàn phụ trách thì chưa công bố được.
          </Typography.Text>
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
          <div className="hm-form-context" style={{ marginBottom: 0 }}>
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
