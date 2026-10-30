import { LockOutlined } from '@ant-design/icons'
import { Button, Flex, Result } from 'antd'
import { useNavigate } from 'react-router'
import { colors } from '@/styles/tokens'

/** Shown when a signed-in role opens another role's workspace; its own workspace is one click away. */
export function ForbiddenPage({ homePath }: Readonly<{ homePath: string }>) {
  const navigate = useNavigate()
  return (
    <main>
      <title>Không có quyền truy cập · Harmonia</title>
      <Result
        icon={
          // A plain monochrome icon; the antd status pictures are purple.
          <Flex justify="center">
            <span aria-hidden style={{ fontSize: 40, color: colors.textMuted }}><LockOutlined /></span>
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
