import { SendOutlined } from '@ant-design/icons'
import { App, Button, Card, DatePicker, Flex, Form, Input, Radio, Select, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useSearchParams } from 'react-router'
import { useChoirs, useMembersOfChoir } from '@/features/choirs'
import { useSongMaterials, useSongs } from '@/features/music-library'
import { useCatalogOptions } from '@/features/system-categories'
import { colors, spacing } from '@/styles/tokens'
import { useCreateAssignment, useUpcomingEvents } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import { formatEventOption } from '../practiceFormat'
import { MaterialPicker } from './MaterialPicker'
import type { AssignmentScope, AssignmentValues } from '../types'

interface FormValues extends Omit<AssignmentValues, 'dueDate'> {
  dueDate?: Dayjs
}

const muted = { color: colors.textMuted }

const scopeOptions: { value: AssignmentScope; label: string }[] = [
  { value: 'all', label: 'Cả ca đoàn' },
  { value: 'skillGroup', label: 'Theo kỹ năng' },
  { value: 'individual', label: 'Từng ca viên' },
]

/**
 * Gives a practice assignment (FE-41; `CreatePracticeAssignmentRequestValidator`) to one of the director's choirs (D8,
 * required): event, song and material are optional, the due date is in the future, and the members are the whole
 * choir, its members with chosen skills or chosen members of it. The backend notifies them; the assignment then
 * appears under "Bài đã giao".
 */
export function AssignmentForm() {
  const { message } = App.useApp()
  const [params] = useSearchParams()
  const urlProgramId = params.get('programId') ?? params.get('eventId') ?? undefined
  const [form] = Form.useForm<FormValues>()
  const scope = Form.useWatch('scope', form)
  const songId = Form.useWatch('songId', form)
  const choirId = Form.useWatch('choirId', form)
  const create = useCreateAssignment()
  const events = useUpcomingEvents()
  // ponytail: the first 100 songs by title; a larger library would need the select to search the server.
  const songs = useSongs({ search: '' }, { pageNumber: 1, pageSize: 100 })
  const materials = useSongMaterials(songId ?? '')
  const skills = useCatalogOptions('skills')
  const choirs = useChoirs()
  const activeChoirs = (choirs.data ?? []).filter((choir) => choir.isActive)
  const members = useMembersOfChoir(choirId)

  const handleFinish = ({ dueDate, ...values }: FormValues) => {
    if (!dueDate || create.isPending) return
    create.mutate(
      {
        ...values,
        title: values.title.trim(),
        instruction: values.instruction?.trim() || undefined,
        dueDate: dueDate.toISOString(),
      },
      {
        onSuccess: () => {
          message.success('Đã giao bài tập. Ca viên sẽ nhận được thông báo.')
          form.resetFields()
        },
        onError: (error) => message.error(practiceErrorMessage(error, 'Không thể giao bài tập. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <Card style={{ maxWidth: 720 + spacing.lg * 2 }}>
      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{ scope: 'all', eventId: urlProgramId, choirId: activeChoirs.length === 1 ? activeChoirs[0].id : undefined }}
        onFinish={handleFinish}
        style={{ maxWidth: 720 }}
      >
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
        <Form.Item label="Sự kiện (không bắt buộc)" name="eventId" extra="Các sự kiện sắp tới đã công bố.">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Không gắn với sự kiện"
            loading={events.isPending}
            options={(events.data ?? []).map((event) => ({
              value: event.id,
              label: formatEventOption(event),
            }))}
          />
        </Form.Item>
        <Form.Item label="Bài hát (không bắt buộc)" name="songId">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn bài hát"
            loading={songs.isPending}
            onChange={() => form.setFieldValue('materialId', undefined)}
            options={(songs.data?.items ?? []).map((song) => ({ value: song.id, label: song.title }))}
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
            name="materialId"
            extra="Mỗi bài tập hiện gắn được một tài liệu. Bản nhạc và audio của bài dành cho cả ca đoàn hoặc cho kỹ năng của ca viên vẫn hiện trong mục tài liệu trên ứng dụng của ca viên."
          >
            <MaterialPicker materials={materials.data} />
          </Form.Item>
        )}
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
        <Form.Item label="Giao cho" name="scope">
          <Radio.Group optionType="button" buttonStyle="solid" options={scopeOptions} />
        </Form.Item>
        {scope === 'skillGroup' && (
          <Form.Item label="Kỹ năng" name="skillIds" rules={[{ required: true, message: 'Chọn ít nhất một kỹ năng.' }]}>
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Chọn kỹ năng" options={skills} />
          </Form.Item>
        )}
        {scope === 'individual' && (
          <Form.Item label="Ca viên" name="memberIds" rules={[{ required: true, message: 'Chọn ít nhất một ca viên.' }]}>
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
        <Flex align="center" gap={spacing.md} wrap>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={create.isPending}>
            Giao bài tập
          </Button>
          <Typography.Text style={muted}>Bài tập đã giao xem lại ở thẻ “Bài đã giao”.</Typography.Text>
        </Flex>
      </Form>
    </Card>
  )
}
