import { Button, Flex, Result } from 'antd'
import { useNavigate } from 'react-router'
import { LostLeaf } from '@/shared/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <main>
      <title>Không tìm thấy trang · Harmonia</title>
      <Result
        icon={
          // Drawn for Harmonia; the antd status pictures are purple.
          <Flex justify="center">
            <LostLeaf />
          </Flex>
        }
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
