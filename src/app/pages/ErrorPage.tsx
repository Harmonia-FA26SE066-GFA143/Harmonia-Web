import { WarningOutlined } from '@ant-design/icons'
import { Button, Flex, Result } from 'antd'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { colors } from '@/styles/tokens'
import { NotFoundPage } from './NotFoundPage'

/**
 * Root `errorElement`: a page that throws while rendering or loading (for example a code chunk that is gone after a
 * new deploy) shows this instead of React Router's default English screen. A 404 response keeps the not-found page.
 */
export function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />

  return (
    <main>
      <title>Đã xảy ra lỗi · Harmonia</title>
      <Result
        icon={
          // A plain monochrome icon; the antd status pictures are purple.
          <Flex justify="center">
            <span aria-hidden style={{ fontSize: 40, color: colors.textMuted }}><WarningOutlined /></span>
          </Flex>
        }
        title="Đã xảy ra lỗi"
        subTitle="Trang gặp lỗi khi hiển thị. Hãy tải lại trang; nếu vẫn lỗi, vui lòng báo cho quản trị viên."
        extra={
          <Flex wrap justify="center" gap={8}>
            <Button type="primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
            <Button onClick={() => navigate('/')}>Về trang chủ</Button>
          </Flex>
        }
      />
    </main>
  )
}
