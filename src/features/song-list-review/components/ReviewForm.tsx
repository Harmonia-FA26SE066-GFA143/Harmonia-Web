import { Button, Card, Flex, Input, Typography } from 'antd'
import { CardTitle, Form } from '@/shared/ui'
import { cardSurface, colors, spacing } from '@/styles/tokens'
import type { ReviewDecision, ReviewValues } from '../types'

export interface ReviewFormProps {
  saving?: boolean
  onSubmit: (values: ReviewValues) => void
}

const missingNote: Partial<Record<ReviewDecision, string>> = {
  requestRevision: 'Vui lòng nhập nội dung cần chỉnh sửa.',
  reject: 'Vui lòng nhập lý do từ chối.',
}

/**
 * One decision for the whole submitted list (Harmonia-BE ReviewSongListRequestValidator) as three actions: Duyệt,
 * Yêu cầu sửa, Từ chối. The note is required to request a revision or to reject, ≤ 1000 (SongListReviewConfiguration);
 * the Choir Director reads it.
 */
export function ReviewForm({ saving = false, onSubmit }: Readonly<ReviewFormProps>) {
  const [form] = Form.useForm<{ notes?: string }>()

  const decide = (decision: ReviewDecision) => {
    if (saving) return
    const notes = (form.getFieldValue('notes') as string | undefined)?.trim() || undefined
    const required = missingNote[decision]
    if (required && !notes) {
      form.setFields([{ name: 'notes', errors: [required] }])
      form.focusField('notes')
      return
    }
    onSubmit({ decision, notes })
  }

  return (
    <Card style={cardSurface} title={<CardTitle>Quyết định của Cha xứ</CardTitle>}>
      <Form form={form} layout="vertical" onValuesChange={() => form.setFields([{ name: 'notes', errors: [] }])}>
        <Form.Item
          label="Nhận xét gửi Ca trưởng"
          name="notes"
          extra="Bắt buộc khi yêu cầu sửa hoặc từ chối."
          rules={[{ max: 1000, message: 'Nhận xét tối đa 1000 ký tự.' }]}
        >
          <Input.TextArea rows={3} showCount maxLength={1000} />
        </Form.Item>
        <Flex wrap justify="space-between" align="center" gap={spacing.sm}>
          <Typography.Text style={{ color: colors.textMuted }}>Quyết định áp dụng cho cả danh sách.</Typography.Text>
          <Flex wrap gap={spacing.sm}>
            <Button danger disabled={saving} onClick={() => decide('reject')}>
              Từ chối
            </Button>
            <Button disabled={saving} onClick={() => decide('requestRevision')}>
              Yêu cầu sửa
            </Button>
            <Button type="primary" loading={saving} onClick={() => decide('approve')}>
              Duyệt
            </Button>
          </Flex>
        </Flex>
      </Form>
    </Card>
  )
}
