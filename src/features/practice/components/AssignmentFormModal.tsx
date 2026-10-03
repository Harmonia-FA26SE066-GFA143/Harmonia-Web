import { DatePicker, Form, Input, Modal, Radio, Select, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { colors } from '@/styles/tokens'
import type { PracticeAudience, PracticeAssignmentValues } from '../types'

/** A confirmed member of the program: the only people an assignment can target (decision 2026-10-01). */
export interface PracticeMember {
  memberId: string
  fullName: string
  skills: string[]
}

export interface AssignmentFormModalProps {
  open: boolean
  /** Songs of the program's approved list. */
  songs: { songId: string; title: string }[]
  members: PracticeMember[]
  saving?: boolean
  onSubmit: (values: PracticeAssignmentValues) => void
  onCancel: () => void
}

interface FormValues {
  title: string
  songId: string
  instructions?: string
  dueAt: Dayjs
  audienceKind: PracticeAudience['kind']
  skills?: string[]
  memberIds?: string[]
}

/** Who the audience resolves to, so the Director sees the number of members before sending. */
function audienceSize(members: PracticeMember[], kind: PracticeAudience['kind'], skills: string[] = [], memberIds: string[] = []) {
  if (kind === 'all') return members.length
  if (kind === 'skills') return members.filter((member) => member.skills.some((skill) => skills.includes(skill))).length
  return memberIds.length
}

function AudienceFields({ members }: { members: PracticeMember[] }) {
  const form = Form.useFormInstance<FormValues>()
  const kind = Form.useWatch('audienceKind', form) ?? 'all'
  const skills = Form.useWatch('skills', form)
  const memberIds = Form.useWatch('memberIds', form)
  const skillOptions = [...new Set(members.flatMap((member) => member.skills))].map((skill) => ({ value: skill, label: skill }))

  return (
    <>
      <Form.Item label="Đối tượng" name="audienceKind" extra="Chỉ giao cho ca viên đã xác nhận tham gia chương trình.">
        <Radio.Group
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'skills', label: 'Theo kỹ năng' },
            { value: 'members', label: 'Chọn từng người' },
          ]}
        />
      </Form.Item>
      {kind === 'skills' && (
        <Form.Item name="skills" rules={[{ required: true, type: 'array', min: 1, message: 'Vui lòng chọn ít nhất một kỹ năng.' }]}>
          <Select mode="multiple" aria-label="Kỹ năng" placeholder="Chọn kỹ năng" options={skillOptions} />
        </Form.Item>
      )}
      {kind === 'members' && (
        <Form.Item name="memberIds" rules={[{ required: true, type: 'array', min: 1, message: 'Vui lòng chọn ít nhất một ca viên.' }]}>
          <Select
            mode="multiple"
            aria-label="Ca viên"
            placeholder="Chọn ca viên"
            optionFilterProp="label"
            options={members.map((member) => ({ value: member.memberId, label: member.fullName }))}
          />
        </Form.Item>
      )}
      <Typography.Paragraph style={{ color: colors.textMuted, marginTop: -8 }}>
        Sẽ giao cho {audienceSize(members, kind, skills, memberIds)} ca viên.
      </Typography.Paragraph>
    </>
  )
}

/** Give a practice assignment on one song of the approved list (FE-41, decision 2026-10-01). */
export function AssignmentFormModal({ open, songs, members, saving = false, onSubmit, onCancel }: AssignmentFormModalProps) {
  return (
    <Modal
      open={open}
      title="Giao bài tập"
      okText="Giao bài tập"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      width={600}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<FormValues>
          layout="vertical"
          disabled={saving}
          initialValues={{ audienceKind: 'all' }}
          onFinish={(values) => {
            const song = songs.find((item) => item.songId === values.songId)
            const audience: PracticeAudience =
              values.audienceKind === 'skills'
                ? { kind: 'skills', skills: values.skills ?? [] }
                : values.audienceKind === 'members'
                  ? {
                      kind: 'members',
                      members: members
                        .filter((member) => values.memberIds?.includes(member.memberId))
                        .map(({ memberId, fullName }) => ({ memberId, fullName })),
                    }
                  : { kind: 'all' }
            onSubmit({
              title: values.title.trim(),
              song: { songId: values.songId, title: song?.title ?? values.songId },
              instructions: values.instructions?.trim() || undefined,
              dueAt: values.dueAt.second(0).millisecond(0).toISOString(),
              audience,
            })
          }}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item label="Tên bài tập" name="title" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên bài tập.' }]}>
        <Input placeholder="Ví dụ: Luyện bè trầm nhịp điệp khúc" />
      </Form.Item>
      <Form.Item label="Bài hát" name="songId" rules={[{ required: true, message: 'Vui lòng chọn bài hát.' }]}>
        <Select
          placeholder="Chọn bài hát trong danh sách đã duyệt"
          options={songs.map((song) => ({ value: song.songId, label: song.title }))}
        />
      </Form.Item>
      <Form.Item label="Hướng dẫn" name="instructions">
        <Input.TextArea rows={3} placeholder="Đoạn cần tập, lưu ý về nhịp, hơi… (không bắt buộc)" />
      </Form.Item>
      <Form.Item
        label="Hạn nộp"
        name="dueAt"
        rules={[
          { required: true, message: 'Vui lòng chọn hạn nộp.' },
          {
            // INTERPRETATION – chờ xác nhận: a deadline in the past cannot be met; deadline limits are not decided.
            validator: (_, value?: Dayjs) =>
              !value || value.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(new Error('Hạn nộp phải ở tương lai.')),
          },
        ]}
      >
        <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" placeholder="Chọn ngày và giờ" style={{ width: '100%' }} />
      </Form.Item>
      <AudienceFields members={members} />
    </Modal>
  )
}
