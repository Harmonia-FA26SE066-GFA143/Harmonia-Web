import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Input, Radio, Select } from 'antd'
import { Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { AuthCard } from '@/features/auth'
import { ApiError, errorMessage } from '@/lib/api/errors'
import { Form, Icon, SELECT_POPUP_PROPS } from '@/shared/ui'
import { genderOptions, saintNameRules } from '@/shared/utils/personName'
import { spacing } from '@/styles/tokens'
import { listPublicChoirs, submitRegistration, type RegistrationValues } from '../api/memberRegistrationsApi'

const failureMessage = (error: Error) =>
  errorMessage(
    error,
    {
      RATE_LIMIT_EXCEEDED: 'Bạn đã gửi nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút.',
      VALIDATION_FAILED: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các ô rồi gửi lại.',
      // The chosen choir was switched off or removed meanwhile (MemberRegistrationService.cs:27-30).
      CHOIR_NOT_FOUND: 'Ca đoàn bạn chọn không còn nhận thành viên. Vui lòng chọn ca đoàn khác hoặc để trống.',
    },
    'Không thể gửi yêu cầu. Vui lòng thử lại.',
  )

/** The form's labels for the backend's field names, whatever their case (`FullName`, `fullName`). */
const fieldLabels: Record<string, string> = {
  fullname: 'Họ tên',
  email: 'Email',
  phone: 'Số điện thoại',
  saintname: 'Tên thánh',
  note: 'Lời nhắn',
  preferredchoirid: 'Ca đoàn mong muốn',
}

/** The fields of `errors` in a 400 VALIDATION_FAILED, by their label on this form; an unknown one is left out. */
const fieldsOf = (error: Error | null) =>
  error instanceof ApiError && error.errors
    ? Object.keys(error.errors).flatMap((field) => fieldLabels[field.toLowerCase()] ?? [])
    : []

/** Public request to join the choir. It never creates an account: an Admin decides, then the server emails the sign-in. */
export function JoinChoirPage() {
  const navigate = useNavigate()
  const submit = useMutation({ mutationFn: submitRegistration })
  // Optional: when the list cannot be read the field is left out and the request still goes through.
  const choirs = useQuery({ queryKey: ['choirs', 'public'], queryFn: listPublicChoirs })
  const [form] = Form.useForm<RegistrationValues>()

  if (submit.isSuccess) {
    return (
      <AuthCard
        icon={<Icon name="check-circle" />}
        title="Đã nhận yêu cầu tham gia"
        description="Đây là yêu cầu tham gia, chưa phải tài khoản đăng nhập. Quản trị viên sẽ xem xét. Nếu được chấp nhận, bạn sẽ nhận email có mật khẩu đầu tiên."
      >
        <Button type="primary" block onClick={() => navigate(paths.home)}>Về trang chủ</Button>
      </AuthCard>
    )
  }

  const trimmed = ({ fullName, email, phone, saintName, gender, note, preferredChoirId }: RegistrationValues): RegistrationValues => ({
    gender,
    fullName: fullName.trim(),
    saintName: saintName?.trim() || undefined,
    email: email.trim(),
    phone: phone?.trim() || undefined,
    note: note?.trim() || undefined,
    preferredChoirId,
  })

  return (
    <AuthCard
      compact
      scene="apse"
      title="Đăng ký tham gia ca đoàn"
      description="Gửi thông tin để Quản trị viên xem xét. Yêu cầu này chưa tạo tài khoản đăng nhập."
      footer={<Link to={paths.login}>Đã có tài khoản? Đăng nhập</Link>}
    >
      <Form<RegistrationValues>
        form={form}
        layout="vertical"
        requiredMark={true}
        scrollToFirstError
        onFinish={(values) => {
          if (!submit.isPending) submit.mutate(trimmed(values))
        }}
      >
        <div className="hm-auth__pair">
          <Form.Item name="saintName" label="Tên thánh" rules={saintNameRules}>
            <Input autoComplete="off" placeholder="Ví dụ: Giuse" />
          </Form.Item>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ tên.' }, { max: 100, message: 'Vui lòng nhập tối đa 100 ký tự.' }]}>
            <Input autoComplete="name" />
          </Form.Item>
        </div>
        <div className="hm-auth__pair">
          <Form.Item name="gender" label="Giới tính" rules={[{ required: true, message: 'Vui lòng chọn giới tính.' }]}>
            <Radio.Group options={genderOptions} />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ max: 20, message: 'Vui lòng nhập tối đa 20 ký tự.' }]}>
            <Input type="tel" autoComplete="tel" placeholder="Ví dụ: 0901 234 567" />
          </Form.Item>
        </div>
        {choirs.data && choirs.data.length > 0 ? (
          <div className="hm-auth__pair">
            <Form.Item
              name="email"
              label="Email"
              extra="Nhận mật khẩu đầu khi được duyệt."
              rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Vui lòng nhập email dạng ten@giaoxu.org.' }, { max: 256, message: 'Vui lòng nhập tối đa 256 ký tự.' }]}
            >
              <Input type="email" autoComplete="email" />
            </Form.Item>
            <Form.Item name="preferredChoirId" label="Ca đoàn mong muốn" extra="Để Quản trị viên xếp ca đoàn.">
              <Select
                {...SELECT_POPUP_PROPS}
                allowClear
                placeholder="Chưa chọn"
                options={choirs.data.map((choir) => ({ value: choir.id, label: choir.name }))}
              />
            </Form.Item>
          </div>
        ) : (
          <Form.Item
            name="email"
            label="Email"
            extra="Mật khẩu đầu tiên sẽ gửi tới email này nếu yêu cầu được chấp nhận."
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Vui lòng nhập email dạng ten@giaoxu.org.' }, { max: 256, message: 'Vui lòng nhập tối đa 256 ký tự.' }]}
          >
            <Input type="email" autoComplete="email" />
          </Form.Item>
        )}
        <Form.Item name="note" label="Lời nhắn" rules={[{ max: 500, message: 'Vui lòng nhập tối đa 500 ký tự.' }]}>
          <Input.TextArea rows={2} showCount maxLength={500} placeholder="Ví dụ: Em hát giọng Alto, sinh hoạt được tối thứ Năm." />
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
