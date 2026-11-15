import { Button } from 'antd'
import { useNavigate } from 'react-router'
import { LostLeaf } from '@/shared/ui'
import { StatusPage } from './StatusPage'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <StatusPage
      tabTitle="Không tìm thấy trang"
      picture={<LostLeaf width={240} />}
      code="Lỗi 404"
      title="Không tìm thấy trang"
      description="Không tìm thấy trang bạn cần. Đường dẫn có thể đã đổi hoặc không còn tồn tại."
      actions={
        <Button type="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  )
}
