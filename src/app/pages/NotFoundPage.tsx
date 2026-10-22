import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <main>
      <title>Không tìm thấy trang · Harmonia</title>
      <Result
        status="404"
        title="404"
        subTitle="Không tìm thấy trang bạn cần. Đường dẫn có thể đã đổi hoặc không còn tồn tại."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        }
      />
    </main>
  )
}
