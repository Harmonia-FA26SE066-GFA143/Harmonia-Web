import { Button } from 'antd'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { surfaceByRole, surfaces } from '@/layouts/AppShell/navigation'
import { getSession } from '@/lib/auth/session'
import { LostLeaf } from '@/shared/ui'
import { StatusPage } from './StatusPage'

export function NotFoundPage({ inShell = false, homePath }: Readonly<{ inShell?: boolean; homePath?: string }>) {
  const navigate = useNavigate()
  const user = getSession()?.user
  const surface = user && surfaceByRole[user.roleName]
  const target = homePath ?? (inShell && surface ? surfaces[surface].basePath : paths.home)
  return (
    <StatusPage
      inShell={inShell}
      tabTitle="Không tìm thấy trang"
      picture={<LostLeaf width={240} />}
      code="Lỗi 404"
      title="Không tìm thấy trang"
      description="Không tìm thấy trang bạn cần. Đường dẫn có thể đã đổi hoặc không còn tồn tại."
      actions={
        <Button type="primary" onClick={() => navigate(target)}>
          Về trang chủ
        </Button>
      }
    />
  )
}
