import { App, Button, DatePicker, Input, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { CANCEL_LABEL, Form, FormDrawer, SELECT_POPUP_PROPS } from '@/shared/ui'
import { colors, component, spacing } from '@/styles/tokens'
import { useUpdateAssignment } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import type { PracticeAssignment } from '../types'

interface Values {
  title: string
  instruction?: string
  dueDate?: Dayjs
}

/**
 * Edits what an assignment keeps editable: title, instruction and due date (UpdatePracticeAssignmentRequest.cs,
 * validator: title ≤ 200, instruction ≤ 1000, due date after now). Its audience and materials stay as given.
 */
export function AssignmentEditDrawer({ assignment, onClose }: Readonly<{ assignment?: PracticeAssignment; onClose: () => void }>) {
  const { message } = App.useApp()
  const [form] = Form.useForm<Values>()
  const update = useUpdateAssignment()

  const submit = ({ title, instruction, dueDate }: Values) => {
    if (!assignment || !dueDate || update.isPending) return
    update.mutate(
      { id: assignment.id, values: { title: title.trim(), instruction: instruction?.trim() || undefined, dueDate: dueDate.toISOString() } },
      {
        onSuccess: () => {
          message.success('Đã lưu bài tập.')
          onClose()
        },
        // The drawer stays open so the entered values are not lost.
        onError: (error) => message.error(practiceErrorMessage(error, 'Không thể lưu bài tập. Vui lòng thử lại.')),
      },
    )
  }

  return (
    <FormDrawer
      open={Boolean(assignment)}
      title="Sửa bài tập"
      size={component.drawer.sm}
      okText="Lưu thay đổi"
      cancelText={CANCEL_LABEL}
      okButtonProps={{ loading: update.isPending }}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {assignment && (
        <Form<Values>
          form={form}
          layout="vertical"
          requiredMark
          onFinish={submit}
          initialValues={{ title: assignment.title, instruction: assignment.instruction, dueDate: dayjs(assignment.dueDate) }}
        >
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề.' }, { max: 200, message: 'Tối đa 200 ký tự.' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Hướng dẫn" name="instruction" rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}>
            <Input.TextArea rows={3} showCount maxLength={1000} placeholder="Hướng dẫn luyện tập cho ca viên" />
          </Form.Item>
          <Form.Item
            label="Hạn nộp"
            name="dueDate"
            extra="Người được giao và tài liệu giữ nguyên như lúc giao."
            style={{ marginBottom: spacing.xs }}
            rules={[
              { required: true, message: 'Vui lòng chọn hạn nộp.' },
              {
                validator: (_, value?: Dayjs) =>
                  !value || value.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(new Error('Hạn nộp phải sau thời điểm hiện tại.')),
              },
            ]}
          >
            <DatePicker
              getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
              placement="bottomLeft"
              showTime={{ format: 'HH:mm', minuteStep: 5 }}
              format="DD/MM/YYYY HH:mm"
              placeholder="Chọn ngày giờ"
              disabledDate={(date) => date.isBefore(dayjs(), 'day')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <div className="hm-quick-picks">
            <Typography.Text style={{ color: colors.textMuted, fontSize: 12 }}>Gia hạn nhanh:</Typography.Text>
            <Button size="small" onClick={() => form.setFieldValue('dueDate', dayjs().add(1, 'day').hour(21).minute(0).second(0).millisecond(0))}>
              Tối mai · 21:00
            </Button>
            <Button size="small" onClick={() => form.setFieldValue('dueDate', dayjs().add(3, 'day').hour(21).minute(0).second(0).millisecond(0))}>
              +3 ngày · 21:00
            </Button>
            <Button size="small" onClick={() => form.setFieldValue('dueDate', dayjs().add(7, 'day').hour(21).minute(0).second(0).millisecond(0))}>
              +7 ngày · 21:00
            </Button>
          </div>
        </Form>
      )}
    </FormDrawer>
  )
}
