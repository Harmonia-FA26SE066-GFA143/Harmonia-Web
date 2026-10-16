import { Form, Input, Typography } from 'antd'
import { colors } from '@/styles/tokens'

// The description column and field of catalogs that have one (Harmonia-BE validators: ≤ 300).

export const descriptionColumn = {
  key: 'description',
  title: 'Mô tả',
  dataIndex: 'description',
  render: (description: string | null) =>
    description ? (
      // A long description wraps here instead of widening the table past the card.
      <Typography.Paragraph style={{ margin: 0, minWidth: 200, maxWidth: 300 }}>{description}</Typography.Paragraph>
    ) : (
      <Typography.Text style={{ color: colors.textMuted }}>Chưa có mô tả</Typography.Text>
    ),
}

export const descriptionField = (
  <Form.Item label="Mô tả (không bắt buộc)" name="description" rules={[{ max: 300, message: 'Mô tả tối đa 300 ký tự.' }]}>
    <Input.TextArea rows={3} showCount maxLength={300} />
  </Form.Item>
)
