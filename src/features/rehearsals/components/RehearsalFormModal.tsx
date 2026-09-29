import { DatePicker, Flex, Form, Input, Modal, Select, TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { useSongList } from '@/features/song-lists'
import { spacing } from '@/styles/tokens'
import type { Rehearsal, RehearsalValues } from '../types'

export interface RehearsalFormModalProps {
  open: boolean
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
  programId: string
  name: string
  date: Dayjs
  time: [Dayjs, Dayjs]
  location?: string
  songs?: SongOption[]
  note?: string
}

const clean = (value?: string) => value?.trim() || undefined
const withTime = (date: Dayjs, time: Dayjs) => date.hour(time.hour()).minute(time.minute()).second(0).millisecond(0)

/** Changing the program clears the songs, which belong to the previous program's list. */
function ProgramField({ programs }: { programs: LiturgicalProgram[] }) {
  const form = Form.useFormInstance<FormValues>()
  return (
    <Form.Item label="Chương trình phụng vụ" name="programId" rules={[{ required: true, message: 'Vui lòng chọn chương trình.' }]}>
      <Select
        showSearch
        optionFilterProp="label"
        placeholder="Chọn chương trình"
        options={programs.map((program) => ({
          value: program.id,
          label: `${program.eventName} · ${formatProgramDate(program.date)}`,
        }))}
        onChange={() => form.setFieldValue('songs', [])}
      />
    </Form.Item>
  )
}

/** Song choices come from the selected program's song list. */
function SongsField() {
  const programId: string = Form.useWatch('programId', Form.useFormInstance()) ?? ''
  const songList = useSongList(programId, { enabled: Boolean(programId) })
  const options = (songList.data?.items ?? []).map((item) => ({ value: item.songId, label: item.title }))
  const noSongs = songList.isSuccess && options.length === 0

  return (
    <Form.Item
      label="Bài hát tập"
      name="songs"
      extra={noSongs ? 'Chương trình chưa có danh sách bài hát; có thể thêm bài sau.' : undefined}
    >
      <Select
        mode="multiple"
        labelInValue
        allowClear
        disabled={!programId}
        loading={songList.isFetching}
        placeholder={programId ? 'Chọn bài hát từ danh sách của chương trình' : 'Chọn chương trình trước'}
        options={options}
        optionFilterProp="label"
      />
    </Form.Item>
  )
}

/**
 * Create or edit a rehearsal (FE-26) with the fields decided on 2026-09-29. Only program, name, date and time are
 * required; requiredness of the rest is not specified. Songs come from the chosen program's song list.
 */
export function RehearsalFormModal({
  open,
  programs,
  rehearsal,
  defaultProgramId,
  saving = false,
  onSubmit,
  onCancel,
}: RehearsalFormModalProps) {
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
          disabled={saving}
          initialValues={{
            programId: rehearsal?.programId ?? defaultProgramId,
            name: rehearsal?.name,
            date: rehearsal ? dayjs(rehearsal.startAt) : undefined,
            time: rehearsal ? [dayjs(rehearsal.startAt), dayjs(rehearsal.endAt)] : undefined,
            location: rehearsal?.location,
            songs: rehearsal?.songs.map((song) => ({ value: song.songId, label: song.title })),
            note: rehearsal?.note,
          }}
          onFinish={(values) =>
            onSubmit({
              programId: values.programId,
              name: values.name.trim(),
              startAt: withTime(values.date, values.time[0]).toISOString(),
              endAt: withTime(values.date, values.time[1]).toISOString(),
              location: clean(values.location),
              songs: (values.songs ?? []).map((song) => ({ songId: song.value, title: song.label })),
              note: clean(values.note),
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <ProgramField programs={programs} />
      <Form.Item label="Tên buổi tập" name="name" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên buổi tập.' }]}>
        <Input placeholder="Ví dụ: Tập chính ráp 4 bè" />
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
      <Form.Item label="Địa điểm" name="location">
        <Input placeholder="Ví dụ: Phòng tập nhà xứ" />
      </Form.Item>
      <SongsField />
      <Form.Item label="Ghi chú" name="note">
        <Input.TextArea rows={3} placeholder="Nội dung chính của buổi tập (không bắt buộc)" />
      </Form.Item>
    </Modal>
  )
}
