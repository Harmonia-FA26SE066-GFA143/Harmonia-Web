import { SendOutlined } from '@ant-design/icons'
import { App, Button, Card, DatePicker, Flex, Input, Radio, Select, Typography, type SelectProps } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useChoirs, useCurrentChoir, useMembersOfChoir } from '@/features/choirs'
import { useChoirMembers } from '@/features/members'
import { useSong, useSongMaterials, useSongs } from '@/features/music-library'
import { useSongList } from '@/features/song-lists'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { matchesSearch } from '@/shared/utils/search'
import { useCatalogOptions } from '@/features/system-categories'
import { colors, spacing } from '@/styles/tokens'
import { useCreateAssignment, useUpcomingEvents } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import { formatEventOption } from '../practiceFormat'
import { MaterialPicker } from './MaterialPicker'
import type { AssignmentScope, AssignmentValues } from '../types'
import { CREATE_ASSIGNMENT_LABEL, Form } from '@/shared/ui'

interface FormValues extends Omit<AssignmentValues, 'dueDate'> {
  dueDate?: Dayjs
}

export interface AssignmentFormProps {
  onCancel: () => void
  onCreated: (title: string) => void
}

const muted = { color: colors.textMuted }

const scopeOptions: { value: AssignmentScope; label: string }[] = [
  { value: 'all', label: 'Cả ca đoàn' },
  { value: 'skillGroup', label: 'Theo kỹ năng' },
  { value: 'individual', label: 'Từng ca viên' },
]

/**
 * How many will be notified, when it can be known: the choir's members, the ones picked, or the choir's members
 * holding one of the chosen skills (the backend matches them; `withSkill` is the same count worked out here).
 */
function recipientCount(scope: AssignmentScope | undefined, choirSize?: number, picked?: string[], withSkill?: number) {
  if (scope === 'all') return choirSize
  if (scope === 'individual') return picked?.length
  return withSkill
}

/** The recipients in words, for the summary. */
function recipientText(scope: AssignmentScope | undefined, count: number | undefined, skillNames: string[]) {
  if (scope === 'skillGroup') {
    if (skillNames.length === 0) return 'Chưa chọn kỹ năng'
    const who = count === undefined ? 'Ca viên' : `${count} ca viên`
    return `${who} có kỹ năng ${skillNames.join(', ')}`
  }
  if (count === undefined) return '—'
  return scope === 'all' ? `${count} ca viên (cả ca đoàn)` : `${count} ca viên`
}

/** The due date, with the days left while it is ahead. */
function dueSummary(dueDate?: Dayjs) {
  if (!dueDate) return '—'
  const when = dueDate.format('HH:mm DD/MM/YYYY')
  const daysLeft = Math.ceil(dueDate.diff(dayjs(), 'day', true))
  return daysLeft >= 0 ? `${when} · còn ${daysLeft} ngày` : when
}

/** The send button names its effect when the number is known. */
const submitLabel = (count?: number) => (count ? `Giao bài cho ${count} ca viên` : CREATE_ASSIGNMENT_LABEL)

/**
 * Gives a practice assignment (FE-41; `CreatePracticeAssignmentRequestValidator`) to one of the director's choirs (D8,
 * required): event, song and materials (several since BE 718696c) are optional, the due date is in the future, and the members are the whole
 * choir, its members with chosen skills or chosen members of it. The backend notifies them; the assignment then
 * appears under "Bài đã giao".
 */
export function AssignmentForm({ onCancel, onCreated }: Readonly<AssignmentFormProps>) {
  const { message } = App.useApp()
  const [params] = useSearchParams()
  const urlProgramId = params.get('programId') ?? params.get('eventId') ?? undefined
  const [form] = Form.useForm<FormValues>()
  const scope = Form.useWatch('scope', form)
  const songId = Form.useWatch('songId', form)
  const choirId = Form.useWatch('choirId', form)
  const create = useCreateAssignment()
  const events = useUpcomingEvents()
  // The library is searched on the server, like the rehearsal form: a page of titles never holds a whole library.
  const [songSearch, setSongSearch] = useState('')
  const songs = useSongs({ search: useDebouncedValue(songSearch) }, { pageNumber: 1, pageSize: 50 })
  const urlSongId = params.get('songId') ?? undefined
  // A song chosen earlier or named in the link may not be on the searched page; its title is kept apart.
  const linkedSong = useSong(urlSongId ?? '', Boolean(urlSongId))
  const [pickedSong, setPickedSong] = useState<{ value: string; label: string }>()
  const materials = useSongMaterials(songId ?? '')
  const skills = useCatalogOptions('skills')
  const choirs = useChoirs()
  const activeChoirs = (choirs.data ?? []).filter((choir) => choir.isActive)
  const currentChoir = useCurrentChoir()
  // The choir of the running head, else the only one the director leads. The form reads `initialValues` once, usually
  // before the choirs have loaded, so the field is filled when they arrive, unless the director already chose.
  const defaultChoirId = currentChoir ?? (activeChoirs.length === 1 ? activeChoirs[0].id : undefined)
  useEffect(() => {
    if (defaultChoirId && !form.getFieldValue('choirId')) form.setFieldValue('choirId', defaultChoirId)
  }, [defaultChoirId, form])
  const members = useMembersOfChoir(choirId)
  const eventId = Form.useWatch('eventId', form)
  const dueDate = Form.useWatch('dueDate', form)
  const materialIds = Form.useWatch('materialIds', form)
  const skillIds = Form.useWatch('skillIds', form)
  const memberIds = Form.useWatch('memberIds', form)
  const skillNames = (skills ?? []).filter((skill) => skillIds?.includes(String(skill.value))).map((skill) => skill.label)
  // ponytail: approved skills come from the first 100 active profiles; a larger parish leaves the count unknown-low.
  const profiles = useChoirMembers()
  const skillsOf = new Map((profiles.data ?? []).map((member) => [member.id, member.skills]))
  const withSkill =
    members.data && profiles.data && skillNames.length > 0
      ? members.data.filter((member) => skillsOf.get(member.memberId)?.some((name) => skillNames.includes(name))).length
      : undefined
  const recipients = recipientCount(scope, members.data?.length, memberIds, withSkill)
  const choirName = activeChoirs.find((choir) => choir.id === choirId)?.name
  // The songs of the chosen event's list come first: they are what the choir prepares for it.
  const eventSongList = useSongList(eventId ?? '', { enabled: Boolean(eventId) })
  const eventSongs = [...new Map((eventSongList.data?.items ?? []).map((item) => [item.songId, { value: item.songId, label: item.songTitle }])).values()]
  const librarySongs = (songs.data?.items ?? []).map((song) => ({ value: song.id, label: song.title }))
  const chosenSong =
    [pickedSong, ...eventSongs, ...librarySongs].find((option) => option?.value === songId) ??
    (linkedSong.data && linkedSong.data.id === songId ? { value: linkedSong.data.id, label: linkedSong.data.title } : undefined)
  const inEvent = new Set(eventSongs.map((option) => option.value))
  const shownEventSongs = eventSongs.filter((option) => matchesSearch(songSearch, option.label))
  const otherSongs = [
    ...(chosenSong && !inEvent.has(chosenSong.value) && !librarySongs.some((option) => option.value === chosenSong.value) ? [chosenSong] : []),
    ...librarySongs.filter((option) => !inEvent.has(option.value)),
  ]
  const songOptions: SelectProps['options'] = shownEventSongs.length > 0 ? [{ label: 'Trong danh sách của sự kiện', options: shownEventSongs }, { label: 'Kho bài hát', options: otherSongs }] : otherSongs
  const songTitle = chosenSong?.label
  const event = events.data?.find((item) => item.id === eventId)

  const resetForm = () => {
    form.resetFields()
    // `initialValues` may have been read before the choir query completed, so restore the asynchronous default too.
    if (defaultChoirId) form.setFieldValue('choirId', defaultChoirId)
  }

  const handleFinish = ({ dueDate, ...values }: FormValues) => {
    if (!dueDate || create.isPending) return
    // The backend would save it and notify nobody, and an assignment cannot be withdrawn afterwards.
    if (recipients === 0) {
      message.warning(
        values.scope === 'all'
          ? 'Ca đoàn này chưa có ca viên nào, nên chưa giao bài được.'
          : 'Không ca viên nào của ca đoàn này có kỹ năng đã chọn. Chọn kỹ năng khác hoặc giao cho từng ca viên.',
      )
      return
    }
    create.mutate(
      {
        ...values,
        title: values.title.trim(),
        instruction: values.instruction?.trim() || undefined,
        skillIds: values.scope === 'skillGroup' ? values.skillIds : undefined,
        memberIds: values.scope === 'individual' ? values.memberIds : undefined,
        dueDate: dueDate.toISOString(),
      },
      {
        onSuccess: () => {
          message.success('Đã giao bài tập. Ca viên sẽ nhận được thông báo.')
          onCreated(values.title.trim())
        },
        onError: (error) => message.error(practiceErrorMessage(error, 'Không thể giao bài tập. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <Card style={{ maxWidth: 960 }}>
        <Form<FormValues>
          form={form}
          layout="vertical"
          initialValues={{ scope: 'all', eventId: urlProgramId, songId: params.get('songId') ?? undefined, choirId: defaultChoirId }}
          onFinish={handleFinish}
        >
          <section className="hm-form-section">
            <p className="hm-rubric">1. Ngữ cảnh</p>
            <Form.Item
              label="Ca đoàn"
              name="choirId"
              rules={[{ required: true, message: 'Vui lòng chọn ca đoàn.' }]}
              extra={
                choirs.isSuccess && activeChoirs.length === 0
                  ? 'Bạn chưa phụ trách ca đoàn nào đang hoạt động. Quản trị viên chọn ca trưởng cho ca đoàn.'
                  : 'Bài tập chỉ giao cho ca viên của ca đoàn này; nếu gắn sự kiện, ca đoàn phải phục vụ sự kiện đó.'
              }
            >
              <Select
                placeholder="Chọn ca đoàn"
                loading={choirs.isPending}
                onChange={() => form.setFieldValue('memberIds', undefined)}
                options={activeChoirs.map((choir) => ({ value: choir.id, label: choir.name }))}
              />
            </Form.Item>
            <Form.Item label="Chương trình (không bắt buộc)" name="eventId" extra="Các chương trình sắp tới đã công bố.">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Không gắn với chương trình"
                loading={events.isPending}
                options={(events.data ?? []).map((item) => ({
                  value: item.id,
                  label: formatEventOption(item),
                }))}
              />
            </Form.Item>
          </section>
          <section className="hm-form-section">
            <p className="hm-rubric">2. Nội dung luyện tập</p>
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề.' },
                { max: 200, message: 'Tiêu đề tối đa 200 ký tự.' },
              ]}
            >
              <Input placeholder="Ví dụ: Tập bè Tenor bài Con Bước Lên Bàn Thờ" />
            </Form.Item>
            <Form.Item label="Hướng dẫn (không bắt buộc)" name="instruction" rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}>
              <Input.TextArea rows={3} showCount maxLength={1000} />
            </Form.Item>
            <Form.Item label="Bài hát (không bắt buộc)" name="songId">
              <Select
                allowClear
                showSearch
                filterOption={false}
                onSearch={setSongSearch}
                placeholder="Gõ tên bài để tìm trong kho"
                loading={songs.isFetching}
                onChange={(value?: string) => {
                  setPickedSong(value ? [...eventSongs, ...librarySongs].find((option) => option.value === value) : undefined)
                  setSongSearch('')
                  form.setFieldValue('materialIds', undefined)
                }}
                options={songOptions}
              />
            </Form.Item>
            {songId && materials.isPending && <Typography.Paragraph style={muted}>Đang tải tài liệu của bài…</Typography.Paragraph>}
            {songId && materials.isError && <Typography.Paragraph type="danger">Không thể tải tài liệu của bài hát.</Typography.Paragraph>}
            {songId && materials.data?.length === 0 && (
              <Typography.Paragraph style={muted}>Bài hát chưa có bản nhạc hay audio; tải lên trong Kho bài hát.</Typography.Paragraph>
            )}
            {songId && !!materials.data?.length && (
              <Form.Item
                label="Tài liệu gửi kèm"
                name="materialIds"
                extra="Chọn một hoặc nhiều tài liệu, ví dụ bản nhạc và audio mẫu. Bản nhạc và audio của bài dành cho cả ca đoàn hoặc cho kỹ năng của ca viên vẫn hiện trong mục tài liệu trên ứng dụng của ca viên."
              >
                <MaterialPicker materials={materials.data} />
              </Form.Item>
            )}
          </section>
          <section className="hm-form-section">
            <p className="hm-rubric">3. Người nhận</p>
            <Form.Item label="Giao cho" name="scope">
              <Radio.Group optionType="button" buttonStyle="solid" options={scopeOptions} />
            </Form.Item>
            {scope === 'skillGroup' && (
              <Form.Item label="Kỹ năng" name="skillIds" preserve={false} rules={[{ required: true, message: 'Chọn ít nhất một kỹ năng.' }]}>
                <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Chọn kỹ năng" options={skills} />
              </Form.Item>
            )}
            {scope === 'individual' && (
              <Form.Item label="Ca viên" name="memberIds" preserve={false} rules={[{ required: true, message: 'Chọn ít nhất một ca viên.' }]}>
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  placeholder={choirId ? 'Chọn ca viên của ca đoàn' : 'Chọn ca đoàn trước'}
                  disabled={!choirId}
                  loading={Boolean(choirId) && members.isPending}
                  options={(members.data ?? []).map((member) => ({ value: member.memberId, label: member.fullName }))}
                />
              </Form.Item>
            )}
          </section>
          <section className="hm-form-section">
            <p className="hm-rubric">4. Hạn nộp</p>
            <Form.Item
              label="Hạn nộp"
              name="dueDate"
              rules={[
                { required: true, message: 'Vui lòng chọn hạn nộp.' },
                {
                  validator: (_, value?: Dayjs) =>
                    !value || value.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(new Error('Hạn nộp phải sau thời điểm hiện tại.')),
                },
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm', minuteStep: 5 }}
                format="DD/MM/YYYY HH:mm"
                placeholder="Chọn ngày giờ"
                disabledDate={(date) => date.isBefore(dayjs(), 'day')}
                style={{ width: '100%', maxWidth: 260 }}
              />
            </Form.Item>
          </section>
          <section className="hm-form-section" aria-label="Kiểm tra trước khi giao">
            <p className="hm-rubric">5. Kiểm tra và giao</p>
            <dl className="hm-facts hm-assignment-review">
              <dt>Ca đoàn</dt>
              <dd>{choirName ?? 'Chưa chọn'}</dd>
              <dt>Người nhận</dt>
              <dd>{recipientText(scope, recipients, skillNames)}</dd>
              <dt>Bài hát</dt>
              <dd>{songTitle ?? 'Không gắn bài hát'}</dd>
              <dt>Tài liệu</dt>
              <dd>{materialIds?.length ? `${materialIds.length} tài liệu gửi kèm` : 'Không gửi kèm'}</dd>
              <dt>Hạn nộp</dt>
              <dd>{dueSummary(dueDate)}</dd>
              <dt>Chương trình</dt>
              <dd>{event ? formatEventOption(event) : 'Không gắn chương trình'}</dd>
            </dl>
            <Typography.Text style={muted}>Ca viên nhận được thông báo ngay sau khi bài được giao.</Typography.Text>
          </section>
          <Flex align="center" justify="flex-end" gap={spacing.md} wrap>
            <Button onClick={resetForm} disabled={create.isPending}>
              Xoá nội dung
            </Button>
            <Button onClick={onCancel} disabled={create.isPending}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={create.isPending}>
              {submitLabel(recipients)}
            </Button>
          </Flex>
        </Form>
    </Card>
  )
}
