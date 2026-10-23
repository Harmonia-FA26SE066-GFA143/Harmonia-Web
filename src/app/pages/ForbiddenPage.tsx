import { LockOutlined } from '@ant-design/icons'
import { Button, Flex, Result } from 'antd'
import { useNavigate } from 'react-router'
import { IconTile } from '@/shared/ui'

/** Shown when a signed-in role opens another role's workspace; its own workspace is one click away. */
export function ForbiddenPage({ homePath }: Readonly<{ homePath: string }>) {
  const navigate = useNavigate()
  return (
    <main>
      <title>Không có quyền truy cập · Harmonia</title>
      <Result
        icon={
          // A burgundy tile, as in the empty states; the antd status pictures are purple.
          <Flex justify="center">
            <IconTile size={72}>
              <LockOutlined />
            </IconTile>
          </Flex>
        }
        title="403"
        subTitle="Bạn không có quyền xem trang này. Trang thuộc không gian làm việc của vai trò khác."
        extra={
          <Button type="primary" onClick={() => navigate(homePath)}>
            Về trang của tôi
          </Button>
        }
      />
    </main>
  )
}
