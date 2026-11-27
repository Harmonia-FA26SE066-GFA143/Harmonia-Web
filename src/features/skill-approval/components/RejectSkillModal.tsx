import { Input, Modal, Typography } from 'antd'
import type { PendingSkill } from '../types'
import { CANCEL_LABEL, Form } from '@/shared/ui'

export interface RejectSkillModalProps {
  /** The declaration being rejected, or the approved skill being revoked; the modal is closed without one. */
  skill?: Pick<PendingSkill, 'memberName' | 'skillName'>
  /** Revoke an approved skill instead of rejecting a declaration (same reason rules, RevokeMemberSkillRequestValidator). */
  revoke?: boolean
  saving?: boolean
  onSubmit: (reason: string) => void
  onCancel: () => void
  /** Called once the modal has closed, after Ant Design has given the focus back. */
  afterClose?: () => void
}

/** Asks for the reason the member will see (Harmonia-BE RejectMemberSkillRequestValidator: required, ≤ 500). */
export function RejectSkillModal({ skill, revoke = false, saving = false, onSubmit, onCancel, afterClose }: Readonly<RejectSkillModalProps>) {
  const verb = revoke ? 'thu hồi' : 'từ chối'
  return (
    <Modal
      open={Boolean(skill)}
      title={revoke ? 'Thu hồi kỹ năng' : 'Từ chối kỹ năng'}
      okText={revoke ? 'Thu hồi' : 'Từ chối'}
      cancelText={CANCEL_LABEL}
      okButtonProps={{ htmlType: 'submit', danger: true, loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      afterClose={afterClose}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<{ reason: string }>
          layout="vertical"
          onFinish={({ reason }) => onSubmit(reason.trim())}
        >
          {dom}
        </Form>
      )}
    >
      {skill && (
        <Typography.Paragraph>
          {revoke ? `${skill.memberName} đang có kỹ năng ` : `${skill.memberName} khai báo kỹ năng `}
          <Typography.Text strong>{skill.skillName}</Typography.Text>. Ca viên sẽ nhận được lý do bạn nhập.
          {revoke && ' Kỹ năng thôi được dùng để phân công từ nay.'}
        </Typography.Paragraph>
      )}
      <Form.Item
        label={`Lý do ${verb}`}
        name="reason"
        rules={[
          { required: true, whitespace: true, message: `Vui lòng nhập lý do ${verb}.` },
          { max: 500, message: 'Lý do tối đa 500 ký tự.' },
        ]}
      >
        <Input.TextArea
          rows={4}
          showCount
          maxLength={500}
          autoFocus
          placeholder={
            revoke
              ? 'Ví dụ: Ca viên tạm chuyển bè, cần đánh giá lại trước khi phân công.'
              : 'Ví dụ: Cần luyện thêm cao độ và nhịp trước khi duyệt bè này.'
          }
        />
      </Form.Item>
    </Modal>
  )
}
