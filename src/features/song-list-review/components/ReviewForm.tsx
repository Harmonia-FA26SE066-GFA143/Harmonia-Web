import { Button, Card, Flex, Form, Input, Radio } from 'antd'
import { spacing } from '@/styles/tokens'
import { reviewDecisionLabels, type ReviewDecision, type ReviewValues } from '../types'

const decisions: ReviewDecision[] = ['approve', 'requestRevision', 'reject']

export interface ReviewFormProps {
  saving?: boolean
  onSubmit: (values: ReviewValues) => void
}

/**
 * One decision for the whole submitted list (Harmonia-BE ReviewSongListRequestValidator): the note is required to
 * request a revision or to reject, ≤ 1000 (SongListReviewConfiguration). The Choir Director reads it.
 */
export function ReviewForm({ saving = false, onSubmit }: ReviewFormProps) {
  const [form] = Form.useForm<ReviewValues>()
  const decision = Form.useWatch('decision', form)
  const notesRequired = decision === 'requestRevision' || decision === 'reject'

  return (
    <Card title="Quyết định">
      <Form<ReviewValues>
        form={form}
        layout="vertical"
        disabled={saving}
        onFinish={({ decision: chosen, notes }) => onSubmit({ decision: chosen, notes: notes?.trim() || undefined })}
      >
        <Form.Item name="decision" rules={[{ required: true, message: 'Vui lòng chọn quyết định.' }]}>
          <Radio.Group
            aria-label="Quyết định"
            options={decisions.map((value) => ({ value, label: reviewDecisionLabels[value] }))}
          />
        </Form.Item>
        <Form.Item
          label={notesRequired ? 'Ghi chú gửi Ca trưởng' : 'Ghi chú gửi Ca trưởng (không bắt buộc)'}
          name="notes"
          dependencies={['decision']}
          rules={[
            ({ getFieldValue }) => ({
              required: getFieldValue('decision') === 'requestRevision' || getFieldValue('decision') === 'reject',
              whitespace: true,
              message:
                getFieldValue('decision') === 'reject' ? 'Vui lòng nhập lý do từ chối.' : 'Vui lòng nhập nội dung cần chỉnh sửa.',
            }),
            { max: 1000, message: 'Ghi chú tối đa 1000 ký tự.' },
          ]}
        >
          <Input.TextArea rows={3} showCount maxLength={1000} />
        </Form.Item>
        <Flex justify="flex-end">
          <Button type="primary" htmlType="submit" loading={saving} danger={decision === 'reject'} style={{ marginTop: spacing.xs }}>
            Gửi quyết định
          </Button>
        </Flex>
      </Form>
    </Card>
  )
}
