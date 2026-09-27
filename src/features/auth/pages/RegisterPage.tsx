import { CheckCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { AuthCard } from '../components/AuthCard'
import { RegisterForm } from '../components/RegisterForm'
import { useRegister } from '../hooks/useAuthMutations'
import type { RegistrationValues } from '../types'

export function RegisterPage() {
  const navigate = useNavigate()
  const registration = useRegister()

  if (registration.isSuccess) {
    return (
      <AuthCard
        icon={<CheckCircleOutlined />}
        title="Đăng ký thành công"
        description="Tài khoản của bạn đang chờ Quản trị viên xác nhận vai trò. Bạn có thể đăng nhập để xem trạng thái tài khoản."
      >
        <Button type="primary" block onClick={() => navigate(paths.login)}>
          Đến trang đăng nhập
        </Button>
      </AuthCard>
    )
  }

  const handleSubmit = ({ confirmPassword: _confirm, ...values }: RegistrationValues) => {
    registration.mutate(values)
  }

  return (
    <AuthCard
      title="Đăng ký tài khoản"
      description="Tạo tài khoản để bắt đầu sử dụng Harmonia."
      footer={
        <>
          Đã có tài khoản? <Link to={paths.login}>Đăng nhập</Link>
        </>
      }
    >
      <RegisterForm
        onSubmit={handleSubmit}
        submitting={registration.isPending}
        // TBD: Backend API missing – "email already registered" is shown once the error format is known.
        error={registration.isError ? { kind: 'unavailable' } : undefined}
      />
    </AuthCard>
  )
}
