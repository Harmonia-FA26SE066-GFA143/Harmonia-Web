import { DeleteOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { App, Button, Flex, Form, InputNumber, Modal, Select, Tag, Typography } from 'antd'
import { useState } from 'react'
import { colors, spacing } from '@/styles/tokens'
import { catalogErrorMessage } from '../catalogErrors'
import { useCatalogOptions } from '../hooks/useCatalogOptions'
import { useSaveSlotRequirements, useSlotRequirements } from '../hooks/useCatalogs'
import type { LiturgicalSlot, SlotRequirement, SlotRequirementValue } from '../types'

const muted = { color: colors.textMuted }

function SlotRequirementsModal({
  slot,
  requirements,
  onClose,
}: Readonly<{ slot: LiturgicalSlot; requirements: SlotRequirement[]; onClose: () => void }>) {
  const { message } = App.useApp()
  const save = useSaveSlotRequirements(slot.id)
  const active = useCatalogOptions('skills')
  // A skill switched off later may stay on the slot (the backend keeps it), so it is offered under its current name.
  const options = [
    ...active,
    ...requirements
      .filter((row) => !active.some((option) => option.value === row.skillId))
      .map((row) => ({ value: row.skillId, label: `${row.skillName} (ngừng dùng)` })),
  ]
  const [form] = Form.useForm<{ requirements: SlotRequirementValue[] }>()
  const chosen: (string | undefined)[] = (Form.useWatch('requirements', form) ?? []).map((row?: { skillId?: string }) => row?.skillId)

  return (
    <Modal
      open
      title={`Người cần cho ${slot.name}`}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: save.isPending }}
      cancelButtonProps={{ disabled: save.isPending }}
      onCancel={onClose}
      mask={{ closable: !save.isPending }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ requirements: requirements.map(({ skillId, requiredCount }) => ({ skillId, requiredCount })) }}
          onFinish={({ requirements: rows }) =>
            !save.isPending &&
            save.mutate(rows ?? [], {
              onSuccess: () => {
                message.success(`Đã lưu người cần cho ${slot.name}.`)
                onClose()
              },
              onError: (error) => message.error(catalogErrorMessage(error, 'Không thể lưu. Vui lòng thử lại.')),
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <Typography.Paragraph style={muted}>
        Phần này luôn cần những người này, dù chọn bài nào (ví dụ Đáp ca cần 1 người xướng). Khi ca trưởng lập danh sách bài,
        yêu cầu nhân sự của bài ở phần này được điền sẵn theo đây.
      </Typography.Paragraph>
      <Form.List name="requirements">
        {(fields, { add, remove }) => (
          <Flex vertical gap={spacing.sm}>
            {fields.map((field, index) => (
              <Flex key={field.key} gap={spacing.sm} align="start">
                <Form.Item
                  name={[field.name, 'skillId']}
                  rules={[{ required: true, message: 'Vui lòng chọn kỹ năng.' }]}
                  style={{ flex: 1, margin: 0 }}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn kỹ năng"
                    aria-label={`Kỹ năng ${index + 1}`}
                    // One row per skill: the backend refuses duplicates (PERSONNEL_REQUIREMENT_DUPLICATE).
                    options={options.map((option) => ({
                      ...option,
                      disabled: option.value !== chosen[index] && chosen.includes(option.value),
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name={[field.name, 'requiredCount']}
                  rules={[{ required: true, message: 'Nhập số người.' }]}
                  style={{ margin: 0 }}
                >
                  <InputNumber min={1} max={50} precision={0} addonAfter="người" aria-label={`Số người ${index + 1}`} style={{ width: 130 }} />
                </Form.Item>
                <Button type="text" icon={<DeleteOutlined />} aria-label={`Gỡ kỹ năng ${index + 1}`} onClick={() => remove(field.name)} />
              </Flex>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ requiredCount: 1 })} style={{ alignSelf: 'flex-start' }}>
              Thêm kỹ năng
            </Button>
          </Flex>
        )}
      </Form.List>
    </Modal>
  )
}

/**
 * People a liturgical slot always needs (`GET/PUT api/lookups/liturgical-slots/{id}/requirements`, BE d1ca63e): the
 * current ones as tags and a button to change them.
 */
export function SlotRequirementsCell({ slot }: Readonly<{ slot: LiturgicalSlot }>) {
  const requirements = useSlotRequirements(slot.id)
  const [editing, setEditing] = useState(false)

  let summary
  if (requirements.isPending) summary = <Typography.Text style={muted}>Đang tải…</Typography.Text>
  else if (requirements.isError) summary = <Typography.Text type="danger">Không tải được</Typography.Text>
  else if (requirements.data.length === 0) summary = <Typography.Text style={muted}>Không có</Typography.Text>
  else
    summary = requirements.data.map((row) => (
      <Tag key={row.skillId} style={{ marginInlineEnd: 0 }}>
        {row.skillName} ×{row.requiredCount}
      </Tag>
    ))

  return (
    <Flex wrap align="center" gap={spacing.xs}>
      {summary}
      <Button
        size="small"
        icon={<TeamOutlined />}
        disabled={!requirements.isSuccess}
        onClick={() => setEditing(true)}
        aria-label={`Sửa người cần cho ${slot.name}`}
      >
        Sửa
      </Button>
      {editing && requirements.data && (
        <SlotRequirementsModal slot={slot} requirements={requirements.data} onClose={() => setEditing(false)} />
      )}
    </Flex>
  )
}
