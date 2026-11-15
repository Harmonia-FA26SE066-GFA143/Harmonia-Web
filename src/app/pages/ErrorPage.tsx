import { Button } from 'antd'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { BrokenStaff } from '@/shared/ui'
import { NotFoundPage } from './NotFoundPage'
import { StatusPage } from './StatusPage'

/**
 * Root `errorElement`: a page that throws while rendering or loading (for example a code chunk that is gone after a
 * new deploy) shows this instead of React Router's default English screen. A 404 response keeps the not-found page.
 */
export function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <StatusPage
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
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
        </>
      }
    />
  )
}
