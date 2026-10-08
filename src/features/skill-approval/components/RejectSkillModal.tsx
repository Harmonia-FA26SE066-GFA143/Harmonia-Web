import { Form, Input, Modal, Typography } from 'antd'
import type { PendingSkill } from '../types'

export interface RejectSkillModalProps {
  /** The declaration being rejected; the modal is closed without one. */
  skill?: PendingSkill
  saving?: boolean
  onSubmit: (reason: string) => void
  onCancel: () => void
}

/** Asks for the reason the member will see (Harmonia-BE RejectMemberSkillRequestValidator: required, ≤ 500). */
export function RejectSkillModal({ skill, saving = false, onSubmit, onCancel }: RejectSkillModalProps) {
  return (
    <Modal
      open={Boolean(skill)}
      title="Từ chối kỹ năng"
      okText="Từ chối"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', danger: true, loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<{ reason: string }>
          layout="vertical"
          disabled={saving}
          onFinish={({ reason }) => onSubmit(reason.trim())}
        >
          {dom}
        </Form>
      )}
    >
      {skill && (
        <Typography.Paragraph>
          {skill.memberName} khai báo kỹ năng <Typography.Text strong>{skill.skillName}</Typography.Text>. Ca viên sẽ
          nhận được lý do bạn nhập.
        </Typography.Paragraph>
      )}
      <Form.Item
        label="Lý do từ chối"
        name="reason"
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập lý do từ chối.' },
          { max: 500, message: 'Lý do tối đa 500 ký tự.' },
        ]}
      >
        <Input.TextArea rows={4} showCount maxLength={500} autoFocus />
      </Form.Item>
    </Modal>
  )
}
