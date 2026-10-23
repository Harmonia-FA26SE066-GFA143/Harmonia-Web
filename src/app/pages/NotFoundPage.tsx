import { FileSearchOutlined } from '@ant-design/icons'
import { Button, Flex, Result } from 'antd'
import { useNavigate } from 'react-router'
import { IconTile } from '@/shared/ui'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <main>
      <title>Không tìm thấy trang · Harmonia</title>
      <Result
        icon={
          // A burgundy tile, as in the empty states; the antd status pictures are purple.
          <Flex justify="center">
            <IconTile size={72}>
              <FileSearchOutlined />
            </IconTile>
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
