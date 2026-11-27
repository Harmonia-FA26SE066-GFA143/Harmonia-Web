import { Input, Typography } from 'antd'
import { EmptyCell, Form } from '@/shared/ui'

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
      <EmptyCell text="Chưa có mô tả" />
    ),
}

export const descriptionField = (
  <Form.Item label="Mô tả" name="description" rules={[{ max: 300, message: 'Mô tả tối đa 300 ký tự.' }]}>
    <Input.TextArea rows={3} showCount maxLength={300} />
  </Form.Item>
)
