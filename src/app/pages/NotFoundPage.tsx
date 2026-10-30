import { FileSearchOutlined } from '@ant-design/icons'
import { Button, Flex, Result } from 'antd'
import { useNavigate } from 'react-router'
import { colors } from '@/styles/tokens'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <main>
      <title>Không tìm thấy trang · Harmonia</title>
      <Result
        icon={
          // A plain monochrome icon; the antd status pictures are purple.
          <Flex justify="center">
            <span aria-hidden style={{ fontSize: 40, color: colors.textMuted }}><FileSearchOutlined /></span>
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
