import { Button } from 'antd'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { paths } from '@/app/router/paths'
import { surfaceByRole, surfaces } from '@/layouts/AppShell/navigation'
import { getSession } from '@/lib/auth/session'
import { BrokenStaff } from '@/shared/ui'
import { NotFoundPage } from './NotFoundPage'
import { StatusPage } from './StatusPage'

/**
 * Root / shell `errorElement`: a page that throws while rendering or loading shows this instead of React Router's
 * default English screen. A 404 response keeps the not-found page.
 */
export function ErrorPage({ inShell = false }: Readonly<{ inShell?: boolean }>) {
  const error = useRouteError()
  const navigate = useNavigate()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage inShell={inShell} />
  const user = getSession()?.user
  const surface = user && surfaceByRole[user.roleName]
  const homePath = inShell && surface ? surfaces[surface].basePath : paths.home

  return (
    <StatusPage
      inShell={inShell}
      tabTitle="Đã xảy ra lỗi"
      picture={
        <span style={{ color: 'var(--hm-action-primary)' }}>
          <BrokenStaff width={200} />
        </span>
      }
      code="Lỗi hiển thị"
      title="Đã xảy ra lỗi"
      description="Trang gặp lỗi khi hiển thị. Hãy tải lại trang; nếu vẫn lỗi, vui lòng báo cho quản trị viên."
      actions={
        <>
          <Button type="primary" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
          <Button onClick={() => navigate(homePath)}>Về trang chủ</Button>
        </>
      }
    />
  )
}
