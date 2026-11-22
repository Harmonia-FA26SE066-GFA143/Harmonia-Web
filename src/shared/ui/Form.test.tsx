import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Button, Input, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { describe, expect, it } from 'vitest'
import { Form } from './Form'

describe('Form', () => {
  it('defaults to layout="vertical" and colon={false}, validates on blur, and clears errors on edit (SYS-05, G1-01)', async () => {
    const { container } = render(
      <Form>
        <Form.Item label="Tên bài hát" name="title" rules={[{ required: true, message: 'Vui lòng nhập tên bài hát.' }]}>
          <Input />
        </Form.Item>
      </Form>,
    )

    expect(container.querySelector('.ant-form-vertical')).not.toBeNull()
    const label = container.querySelector('label[for]')
    expect(label).not.toBeNull()
    expect(label).toHaveClass('ant-form-item-no-colon')
    expect(label?.textContent).not.toContain(':')

    const input = screen.getByLabelText('Tên bài hát')
    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(await screen.findByText('Vui lòng nhập tên bài hát.')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Kinh Hòa Bình' } })
    await waitFor(() => expect(screen.queryByText('Vui lòng nhập tên bài hát.')).toBeNull())
  })

  it('supports hiding required marks on all-optional or single-intent forms via requiredMark={false}', () => {
    const { container } = render(
      <Form requiredMark={false}>
        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Bắt buộc' }]}>
          <Input />
        </Form.Item>
      </Form>,
    )
    expect(container.querySelector('.ant-form-item-required-mark-optional')).toBeNull()
    expect(container.querySelector('label.ant-form-item-required')?.textContent).toBe('Email')
  })

  it('clears only the edited nested field error and preserves sibling errors', async () => {
    render(
      <Form>
        <Form.Item label="Trường A" name={['group', 'a']} rules={[{ required: true, message: 'Lỗi A' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Trường B" name={['group', 'b']} rules={[{ required: true, message: 'Lỗi B' }]}>
          <Input />
        </Form.Item>
        <Button htmlType="submit">Gửi</Button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    expect(await screen.findByText('Lỗi A')).toBeInTheDocument()
    expect(screen.getByText('Lỗi B')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Trường A'), { target: { value: 'Đã sửa A' } })
    await waitFor(() => expect(screen.queryByText('Lỗi A')).toBeNull())
    expect(screen.getByText('Lỗi B')).toBeInTheDocument()
  })

  it('clears only the edited Form.List row error and preserves sibling row errors', async () => {
    render(
      <Form initialValues={{ rows: [{ title: '' }, { title: '' }] }}>
        <Form.List name="rows">
          {(fields) =>
            fields.map((field, index) => (
              <Form.Item
                key={field.key}
                label={`Dòng ${index}`}
                name={[field.name, 'title']}
                rules={[{ required: true, message: `Lỗi dòng ${index}` }]}
              >
                <Input />
              </Form.Item>
            ))
          }
        </Form.List>
        <Button htmlType="submit">Lưu</Button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByText('Lỗi dòng 0')).toBeInTheDocument()
    expect(screen.getByText('Lỗi dòng 1')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dòng 0'), { target: { value: 'Hợp lệ' } })
    await waitFor(() => expect(screen.queryByText('Lỗi dòng 0')).toBeNull())
    expect(screen.getByText('Lỗi dòng 1')).toBeInTheDocument()
  })

  it('clears required-array error on Select mode="multiple" immediately on selection while preserving sibling errors', async () => {
    render(
      <Form>
        <Form.Item
          label="Ca đoàn phục vụ"
          name="choirIds"
          rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một ca đoàn phục vụ.' }]}
        >
          <Select
            mode="multiple"
            options={[
              { value: 'c1', label: 'Ca đoàn Cecilia' },
              { value: 'c2', label: 'Ca đoàn Têrêsa' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Ghi chú" name="note" rules={[{ required: true, message: 'Vui lòng nhập ghi chú.' }]}>
          <Input />
        </Form.Item>
        <Button htmlType="submit">Lưu</Button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByText('Chọn ít nhất một ca đoàn phục vụ.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập ghi chú.')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByLabelText('Ca đoàn phục vụ'))
    fireEvent.click(await screen.findByTitle('Ca đoàn Cecilia'))

    await waitFor(() => expect(screen.queryByText('Chọn ít nhất một ca đoàn phục vụ.')).toBeNull())
    expect(screen.getByText('Vui lòng nhập ghi chú.')).toBeInTheDocument()
  })

  it('clears errors on composite [Dayjs, Dayjs] tuple and Select labelInValue fields on edit while preserving sibling errors', async () => {
    function TimeRangeStub({ onChange }: { value?: [Dayjs, Dayjs]; onChange?: (value: [Dayjs, Dayjs]) => void }) {
      return (
        <button
          type="button"
          onClick={() => onChange?.([dayjs('2026-11-20T08:00:00Z'), dayjs('2026-11-20T10:00:00Z')])}
        >
          Chọn khung giờ
        </button>
      )
    }

    render(
      <Form>
        <Form.Item label="Khung giờ" name="time" rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu và kết thúc.' }]}>
          <TimeRangeStub />
        </Form.Item>
        <Form.Item label="Bài hát tập" name="songs" rules={[{ required: true, message: 'Vui lòng chọn bài hát.' }]}>
          <Select
            mode="multiple"
            labelInValue
            options={[
              { value: 's1', label: 'Kinh Hòa Bình' },
              { value: 's2', label: 'Con Bước Lên Bàn Thờ' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Địa điểm" name="location" rules={[{ required: true, message: 'Vui lòng nhập địa điểm.' }]}>
          <Input />
        </Form.Item>
        <Button htmlType="submit">Xác nhận</Button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))
    expect(await screen.findByText('Vui lòng chọn giờ bắt đầu và kết thúc.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng chọn bài hát.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập địa điểm.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Chọn khung giờ' }))
    await waitFor(() => expect(screen.queryByText('Vui lòng chọn giờ bắt đầu và kết thúc.')).toBeNull())
    expect(screen.getByText('Vui lòng chọn bài hát.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập địa điểm.')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByLabelText('Bài hát tập'))
    fireEvent.click(await screen.findByTitle('Kinh Hòa Bình'))
    await waitFor(() => expect(screen.queryByText('Vui lòng chọn bài hát.')).toBeNull())
    expect(screen.getByText('Vui lòng nhập địa điểm.')).toBeInTheDocument()
  })
})
