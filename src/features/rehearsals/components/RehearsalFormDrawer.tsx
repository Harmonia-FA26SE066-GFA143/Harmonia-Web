import { App, Button, Checkbox, DatePicker, Flex, Input, Select, TimePicker, type RefSelectProps } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useRef, useState, type Ref } from 'react'
import { isPlanningDirector, useChoirs, useCurrentChoir, useEventChoirs } from '@/features/choirs'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { useSongs } from '@/features/music-library'
import { useCatalogOptions } from '@/features/system-categories'
import { requestFailureMessage } from '@/lib/api/errors'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { component, spacing } from '@/styles/tokens'
import { useDefaultSongs } from '../hooks/useRehearsals'
import type { Rehearsal, RehearsalValues } from '../types'
import { CANCEL_LABEL, CREATE_REHEARSAL_LABEL, Form, FormDrawer, Icon, SELECT_POPUP_PROPS } from '@/shared/ui'

const PICKER_POPUP_PROPS = { getPopupContainer: SELECT_POPUP_PROPS.getPopupContainer, placement: 'bottomLeft' as const }

export interface RehearsalFormDrawerProps {
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
  choirId?: string
  eventId?: string
  isJoint?: boolean
  date: Dayjs
  time: [Dayjs, Dayjs]
  locationId?: string
  songs?: SongOption[]
  /** Note per chosen song, by song id. */
  songNotes?: Record<string, string | undefined>
  note?: string
}

const withTime = (date: Dayjs, time: Dayjs) => date.hour(time.hour()).minute(time.minute()).second(0).millisecond(0)

/** A new session belongs to the chosen choir; a joint one has none. */
const newSessionChoir = (values: FormValues) => (values.isJoint && values.eventId ? undefined : values.choirId)

/** Songs of the music library, searched on the server; the program's approved list can fill the field. */
function SongsField() {
  const { message } = App.useApp()
  const form = Form.useFormInstance<FormValues>()
  const eventId: string | undefined = Form.useWatch('eventId', form)
  const chosen: SongOption[] | undefined = Form.useWatch('songs', form)
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
          : form.setFieldsValue({
              songs: list.map((song) => ({ value: song.songId, label: song.songTitle })),
              songNotes: Object.fromEntries(list.map((song) => [song.songId, song.note])),
            }),
      onError: (error) => message.error(requestFailureMessage(error, 'Không thể lấy danh sách bài hát của chương trình. Vui lòng thử lại.')),
    })

  return (
    <Form.Item>
      <Flex vertical gap={spacing.sm}>
        {/* The helper has its own row above the field (G4-17): a button cannot sit inside the field's <label>. */}
        <Flex justify="space-between" align="center" wrap gap={spacing.sm}>
          <span id="rehearsal-songs-label" className="ctb-songs-field__label">
            Bài hát tập
          </span>
          <Button size="small" icon={<Icon name="program" />} disabled={!eventId} loading={defaults.isPending} onClick={fillFromProgram}>
            Lấy bài hát từ danh sách đã duyệt của chương trình
          </Button>
        </Flex>
        <Form.Item name="songs" noStyle>
          <Select
            {...SELECT_POPUP_PROPS}
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
        {/* Removing a song keeps its note in the form, but only the notes of chosen songs are sent. */}
        {chosen?.map((song) => (
          <Form.Item key={song.value} name={['songNotes', song.value]} noStyle>
            <Input
              maxLength={500}
              aria-label={`Ghi chú cho bài ${song.label}`}
              placeholder={`${song.label}: cần tập phần nào`}
            />
          </Form.Item>
        ))}
      </Flex>
    </Form.Item>
  )
}

/** The choir of a new session; a joint one has none (it gathers every choir serving the program). */
function ChoirField({
  activeChoirs,
  loading,
  noChoir,
  selectRef,
}: Readonly<{ activeChoirs: { id: string; name: string }[]; loading: boolean; noChoir: boolean; selectRef: Ref<RefSelectProps> }>) {
  const isJoint: boolean | undefined = Form.useWatch('isJoint')
  const eventId: string | undefined = Form.useWatch('eventId')
  if (isJoint && eventId) return null
  return (
    <Form.Item
      label="Ca đoàn"
      name="choirId"
      rules={[{ required: true, message: 'Vui lòng chọn ca đoàn.' }]}
      extra={
        noChoir
          ? 'Bạn chưa phụ trách ca đoàn nào đang hoạt động. Quản trị viên chọn ca trưởng cho ca đoàn.'
          : 'Danh sách điểm danh và thông báo chỉ gồm ca viên của ca đoàn này.'
      }
    >
      <Select {...SELECT_POPUP_PROPS} ref={selectRef} placeholder="Chọn ca đoàn" loading={loading} options={activeChoirs.map((choir) => ({ value: choir.id, label: choir.name }))} />
    </Form.Item>
  )
}

/**
 * A joint rehearsal of every choir serving the chosen program (BE 69c9d47): offered once a program is chosen; only the
 * lead choir's director may plan it (CHOIR_NOT_LEAD otherwise), so the others are not offered it.
 */
function JointField() {
  const eventId: string | undefined = Form.useWatch('eventId')
  return eventId ? <JointOption eventId={eventId} /> : null
}

function JointOption({ eventId }: Readonly<{ eventId: string }>) {
  const choirs = useEventChoirs(eventId)
  if (choirs.data && !isPlanningDirector(choirs.data)) return null
  return (
    <Form.Item name="isJoint" valuePropName="checked" preserve={false} extra="Mọi ca đoàn phục vụ chương trình cùng tập; chỉ ca trưởng ca đoàn phụ trách lên lịch được.">
      <Checkbox>Buổi tập chung các ca đoàn phục vụ chương trình</Checkbox>
    </Form.Item>
  )
}

/**
 * Create or edit a rehearsal (FE-26) as Harmonia-BE takes it: a new one belongs to one of the director's choirs (D8,
 * required, fixed afterwards); date and time required; program, worship location, songs and note (≤ 500) optional.
 * Editing saves the details, then the songs.
 */
export function RehearsalFormDrawer({
  open,
  programs,
  rehearsal,
  defaultProgramId,
  saving = false,
  onSubmit,
  onCancel,
}: Readonly<RehearsalFormDrawerProps>) {
  const locations = useCatalogOptions('worshipLocations')
  const choirs = useChoirs()
  const activeChoirs = (choirs.data ?? []).filter((choir) => choir.isActive)
  const currentChoir = useCurrentChoir()
  // The first field on open: the choir when creating, the program when editing.
  const choirRef = useRef<RefSelectProps>(null)
  const programRef = useRef<RefSelectProps>(null)
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
    <FormDrawer
      open={open}
      title={rehearsal ? 'Sửa buổi tập' : CREATE_REHEARSAL_LABEL}
      okText={rehearsal ? 'Lưu thay đổi' : 'Lên lịch buổi tập'}
      cancelText={CANCEL_LABEL}
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      initialFocusRef={rehearsal ? programRef : choirRef}
      size={component.drawer.md}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<FormValues>
          layout="vertical"
          initialValues={{
            choirId: currentChoir ?? (activeChoirs.length === 1 ? activeChoirs[0].id : undefined),
            eventId: rehearsal ? rehearsal.eventId : defaultProgramId,
            date: rehearsal ? dayjs(rehearsal.startAt) : undefined,
            time: rehearsal ? [dayjs(rehearsal.startAt), dayjs(rehearsal.endAt)] : undefined,
            locationId: rehearsal?.locationId,
            songs: rehearsal?.songs.map((song) => ({ value: song.songId, label: song.songTitle })),
            songNotes: Object.fromEntries((rehearsal?.songs ?? []).map((song) => [song.songId, song.note])),
            note: rehearsal?.note,
          }}
          onFinish={(values) =>
            onSubmit({
              choirId: rehearsal ? rehearsal.choirId : newSessionChoir(values),
              isJoint: rehearsal ? rehearsal.isJoint : Boolean(values.isJoint && values.eventId),
              eventId: values.eventId,
              locationId: values.locationId,
              startAt: withTime(values.date, values.time[0]).toISOString(),
              endAt: withTime(values.date, values.time[1]).toISOString(),
              songs: (values.songs ?? []).map((song) => ({
                songId: song.value,
                songTitle: song.label,
                note: values.songNotes?.[song.value]?.trim() || undefined,
              })),
              note: values.note?.trim() || undefined,
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      {!rehearsal && (
        <ChoirField selectRef={choirRef} activeChoirs={activeChoirs} loading={choirs.isPending} noChoir={choirs.isSuccess && activeChoirs.length === 0} />
      )}
      <Form.Item
        label="Chương trình phụng vụ"
        name="eventId"
        // BE 69c9d47: a joint rehearsal keeps its program (REHEARSAL_JOINT_EVENT_LOCKED).
        extra={rehearsal?.isJoint ? 'Buổi tập chung gắn với chương trình này, không đổi được.' : undefined}
      >
        <Select {...SELECT_POPUP_PROPS} ref={programRef} allowClear={!rehearsal?.isJoint} disabled={rehearsal?.isJoint} showSearch optionFilterProp="label" placeholder="Chọn chương trình" options={programOptions} />
      </Form.Item>
      {!rehearsal && <JointField />}
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Ngày tập" name="date" rules={[{ required: true, message: 'Vui lòng chọn ngày tập.' }]} style={{ flex: '1 1 200px' }}>
          <DatePicker
            {...PICKER_POPUP_PROPS}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            // A new session cannot start in the past (REHEARSAL_START_IN_PAST, BE ac4a7bb); an existing one keeps its day.
            disabledDate={rehearsal ? undefined : (day) => day.isBefore(dayjs(), 'day')}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item
          label="Thời gian"
          name="time"
          dependencies={['date']}
          rules={[
            { required: true, message: 'Vui lòng chọn giờ bắt đầu và kết thúc.' },
            {
              validator: (_, value?: [Dayjs, Dayjs]) =>
                !value || value[1].isAfter(value[0])
                  ? Promise.resolve()
                  : Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu.')),
            },
            ({ getFieldValue }) => ({
              validator: (_, value?: [Dayjs, Dayjs]) => {
                const date: Dayjs | undefined = getFieldValue('date')
                return rehearsal || !value || !date || withTime(date, value[0]).isAfter(dayjs())
                  ? Promise.resolve()
                  : Promise.reject(new Error('Giờ bắt đầu phải sau thời điểm hiện tại.'))
              },
            }),
          ]}
          style={{ flex: '1 1 240px' }}
        >
          <TimePicker.RangePicker {...PICKER_POPUP_PROPS} format="HH:mm" minuteStep={5} placeholder={['Bắt đầu', 'Kết thúc']} style={{ width: '100%' }} />
        </Form.Item>
      </Flex>
      <Form.Item label="Địa điểm" name="locationId">
        <Select {...SELECT_POPUP_PROPS} allowClear showSearch optionFilterProp="label" placeholder="Chọn nơi tập" options={locationOptions} />
      </Form.Item>
      <SongsField />
      <Form.Item label="Ghi chú" name="note">
        <Input.TextArea rows={3} maxLength={500} showCount placeholder="Nội dung chính của buổi tập" />
      </Form.Item>
    </FormDrawer>
  )
}
