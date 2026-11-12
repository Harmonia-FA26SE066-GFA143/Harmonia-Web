import { CheckCircleOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Input } from 'antd'
import { Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { AuthCard } from '@/features/auth'
import { ApiError, errorMessage } from '@/lib/api/errors'
import { Form } from '@/shared/ui'
import { saintNameRules } from '@/shared/utils/personName'
import { spacing } from '@/styles/tokens'
import { submitRegistration, type RegistrationValues } from '../api/memberRegistrationsApi'

const failureMessage = (error: Error) =>
  errorMessage(
    error,
    {
      RATE_LIMIT_EXCEEDED: 'Bạn đã gửi nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút.',
      VALIDATION_FAILED: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các ô rồi gửi lại.',
    },
    'Không thể gửi yêu cầu. Vui lòng thử lại.',
  )

/** Field names of `errors` in a 400 VALIDATION_FAILED, as the backend sends them. */
const fieldsOf = (error: Error | null) => (error instanceof ApiError && error.errors ? Object.keys(error.errors) : [])

/** Public request to join the choir. It never creates an account: an Admin decides, then the server emails the sign-in. */
export function JoinChoirPage() {
  const navigate = useNavigate()
  const submit = useMutation({ mutationFn: submitRegistration })
  const [form] = Form.useForm<RegistrationValues>()

  if (submit.isSuccess) {
    return (
      <AuthCard
        icon={<CheckCircleOutlined />}
        title="Đã nhận yêu cầu tham gia"
        description="Đây là yêu cầu tham gia, chưa phải tài khoản đăng nhập. Quản trị viên sẽ xem xét. Nếu được chấp nhận, bạn sẽ nhận email có mật khẩu đầu tiên."
      >
        <Button type="primary" block onClick={() => navigate(paths.home)}>Về trang chủ</Button>
      </AuthCard>
    )
  }

  const trimmed = ({ fullName, email, phone, saintName, note }: RegistrationValues): RegistrationValues => ({
    fullName: fullName.trim(),
    saintName: saintName?.trim() || undefined,
    email: email.trim(),
    phone: phone?.trim() || undefined,
    note: note?.trim() || undefined,
  })

  return (
    <AuthCard
      title="Đăng ký tham gia ca đoàn"
      description="Gửi thông tin để Quản trị viên xem xét. Yêu cầu này chưa tạo tài khoản đăng nhập."
      footer={<Link to={paths.login}>Đã có tài khoản? Đăng nhập</Link>}
    >
      <Form<RegistrationValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        scrollToFirstError
        onFinish={(values) => {
          if (!submit.isPending) submit.mutate(trimmed(values))
        }}
      >
        <Form.Item name="saintName" label="Tên thánh" rules={saintNameRules}>
          <Input autoComplete="off" placeholder="Giuse" />
        </Form.Item>
        <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' }, { max: 100, message: 'Vui lòng nhập tối đa 100 ký tự.' }]}>
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          extra="Mật khẩu đầu tiên sẽ gửi tới email này nếu yêu cầu được chấp nhận."
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Vui lòng nhập email dạng ten@giaoxu.org.' }, { max: 256, message: 'Vui lòng nhập tối đa 256 ký tự.' }]}
        >
          <Input type="email" autoComplete="email" />
        </Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[{ max: 20, message: 'Vui lòng nhập tối đa 20 ký tự.' }]}>
          <Input type="tel" autoComplete="tel" />
        </Form.Item>
        <Form.Item name="note" label="Lời nhắn" extra="Ví dụ ca đoàn bạn muốn tham gia." rules={[{ max: 500, message: 'Vui lòng nhập tối đa 500 ký tự.' }]}>
          <Input.TextArea rows={3} showCount maxLength={500} />
        </Form.Item>
        {submit.isError && (
          <Alert
            type="error"
            showIcon
            title={failureMessage(submit.error)}
            description={fieldsOf(submit.error).length > 0 ? `Ô cần xem lại: ${fieldsOf(submit.error).join(', ')}.` : undefined}
            style={{ marginBottom: spacing.md }}
          />
        )}
        <Button type="primary" htmlType="submit" block loading={submit.isPending}>Gửi yêu cầu tham gia</Button>
      </Form>
    </AuthCard>
  )
}
