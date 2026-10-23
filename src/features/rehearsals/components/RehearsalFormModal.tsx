import { App, Button, DatePicker, Flex, Form, Input, Modal, Select, TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { useSongs } from '@/features/music-library'
import { useCatalogOptions } from '@/features/system-categories'
import { requestFailureMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { spacing } from '@/styles/tokens'
import { useDefaultSongs } from '../hooks/useRehearsals'
import type { Rehearsal, RehearsalValues } from '../types'

export interface RehearsalFormModalProps {
  open: boolean
  /** Upcoming published programs a session can prepare. */
  programs: LiturgicalProgram[]
  /** Rehearsal being edited; absent when creating. */
  rehearsal?: Rehearsal
  /** Program preselected when creating. */
  defaultProgramId?: string
  saving?: boolean
  onSubmit: (values: RehearsalValues) => void
  onCancel: () => void
}

interface SongOption {
  value: string
  label: string
}

interface FormValues {
  eventId?: string
  date: Dayjs
  time: [Dayjs, Dayjs]
  locationId?: string
  songs?: SongOption[]
  note?: string
}

const withTime = (date: Dayjs, time: Dayjs) => date.hour(time.hour()).minute(time.minute()).second(0).millisecond(0)

/** Songs of the music library, searched on the server; the program's approved list can fill the field. */
function SongsField() {
  const { message } = App.useApp()
  const form = Form.useFormInstance<FormValues>()
  const eventId: string | undefined = Form.useWatch('eventId', form)
  const [search, setSearch] = useState('')
  const songs = useSongs({ search: useDebouncedValue(search) }, { pageNumber: 1, pageSize: 50 })
  const defaults = useDefaultSongs()
  const options = (songs.data?.items ?? []).map((song) => ({ value: song.id, label: song.title }))

  const fillFromProgram = () =>
    eventId &&
    defaults.mutate(eventId, {
      onSuccess: (list) =>
        list.length === 0
          ? message.info('Chương trình chưa có danh sách bài hát đã duyệt.')
          : form.setFieldValue('songs', list.map((song) => ({ value: song.songId, label: song.songTitle }))),
      onError: (error) => message.error(requestFailureMessage(error, 'Không thể lấy danh sách bài hát của chương trình. Vui lòng thử lại.')),
    })

  return (
    <Form.Item label="Bài hát tập (không bắt buộc)">
      <Flex vertical gap={spacing.xs}>
        <Form.Item name="songs" noStyle>
          <Select
            mode="multiple"
            labelInValue
            allowClear
            showSearch
            filterOption={false}
            onSearch={setSearch}
            loading={songs.isFetching}
            aria-label="Bài hát tập"
            placeholder="Tìm bài hát trong kho"
            options={options}
          />
        </Form.Item>
        <div>
          <Button size="small" disabled={!eventId} loading={defaults.isPending} onClick={fillFromProgram}>
            Lấy bài hát từ danh sách đã duyệt của chương trình
          </Button>
        </div>
      </Flex>
    </Form.Item>
  )
}

/**
 * Create or edit a rehearsal (FE-26) as Harmonia-BE takes it: date and time required; program, worship location,
 * songs and note (≤ 500) optional. Editing saves the details, then the songs.
 */
export function RehearsalFormModal({
  open,
  programs,
  rehearsal,
  defaultProgramId,
  saving = false,
  onSubmit,
  onCancel,
}: Readonly<RehearsalFormModalProps>) {
  const locations = useCatalogOptions('worshipLocations')
  // A session keeps a location switched off since, and a program no longer upcoming; both stay selectable.
  const locationOptions =
    rehearsal?.locationId && !locations.some((option) => option.value === rehearsal.locationId)
      ? [...locations, { value: rehearsal.locationId, label: rehearsal.locationName ?? '' }]
      : locations
  const programOptions = programs.map((program) => ({
    value: program.id,
    label: `${program.eventName} · ${formatProgramDate(program.date)}`,
  }))
  if (rehearsal?.eventId && !programs.some((program) => program.id === rehearsal.eventId)) {
    programOptions.push({ value: rehearsal.eventId, label: 'Chương trình đã chọn trước đây' })
  }

  return (
    <Modal
      open={open}
      title={rehearsal ? 'Sửa buổi tập' : 'Tạo buổi tập'}
      okText={rehearsal ? 'Lưu thay đổi' : 'Tạo buổi tập'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      width={640}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<FormValues>
          layout="vertical"
          initialValues={{
            eventId: rehearsal ? rehearsal.eventId : defaultProgramId,
            date: rehearsal ? dayjs(rehearsal.startAt) : undefined,
            time: rehearsal ? [dayjs(rehearsal.startAt), dayjs(rehearsal.endAt)] : undefined,
            locationId: rehearsal?.locationId,
            songs: rehearsal?.songs.map((song) => ({ value: song.songId, label: song.songTitle })),
            note: rehearsal?.note,
          }}
          onFinish={(values) =>
            onSubmit({
              eventId: values.eventId,
              locationId: values.locationId,
              startAt: withTime(values.date, values.time[0]).toISOString(),
              endAt: withTime(values.date, values.time[1]).toISOString(),
              songs: (values.songs ?? []).map((song) => ({ songId: song.value, songTitle: song.label })),
              note: values.note?.trim() || undefined,
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item label="Chương trình phụng vụ (không bắt buộc)" name="eventId">
        <Select allowClear showSearch optionFilterProp="label" placeholder="Chọn chương trình" options={programOptions} />
      </Form.Item>
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Ngày tập" name="date" rules={[{ required: true, message: 'Vui lòng chọn ngày tập.' }]} style={{ flex: '1 1 200px' }}>
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Thời gian"
          name="time"
          rules={[
            { required: true, message: 'Vui lòng chọn giờ bắt đầu và kết thúc.' },
            {
              validator: (_, value?: [Dayjs, Dayjs]) =>
                !value || value[1].isAfter(value[0])
                  ? Promise.resolve()
                  : Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu.')),
            },
          ]}
          style={{ flex: '1 1 240px' }}
        >
          <TimePicker.RangePicker format="HH:mm" minuteStep={5} placeholder={['Bắt đầu', 'Kết thúc']} style={{ width: '100%' }} />
        </Form.Item>
      </Flex>
      <Form.Item label="Địa điểm (không bắt buộc)" name="locationId">
        <Select allowClear showSearch optionFilterProp="label" placeholder="Chọn nơi tập" options={locationOptions} />
      </Form.Item>
      <SongsField />
      <Form.Item label="Ghi chú (không bắt buộc)" name="note">
        <Input.TextArea rows={3} maxLength={500} showCount placeholder="Nội dung chính của buổi tập" />
      </Form.Item>
    </Modal>
  )
}
