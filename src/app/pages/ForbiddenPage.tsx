import { Button } from 'antd'
import { useNavigate } from 'react-router'
import { LockedDoor } from '@/shared/ui'
import { StatusPage } from './StatusPage'

/** Shown when a signed-in role opens another role's workspace; its own workspace is one click away. */
export function ForbiddenPage({ homePath }: Readonly<{ homePath: string }>) {
  const navigate = useNavigate()
  return (
    <StatusPage
      tabTitle="Không có quyền truy cập"
      picture={<LockedDoor width={240} />}
      code="Lỗi 403"
      title="Không có quyền truy cập"
      description="Bạn không có quyền xem trang này. Trang thuộc không gian làm việc của vai trò khác."
      actions={
        <Button type="primary" onClick={() => navigate(homePath)}>
          Về trang của tôi
        </Button>
      }
    />
  )
}
