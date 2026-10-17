import { Layout } from 'antd'
import { Outlet } from 'react-router'
import { layout, spacing } from '@/styles/tokens'

/** Frame for pages outside the application shell: landing page, sign-in, registration, password recovery. */
export function BlankLayout() {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 50% 0%, rgba(142, 59, 75, 0.06) 0%, rgba(248, 249, 250, 0) 55%), #F8F9FA',
      }}
    >
      <Layout.Content style={{ padding: `${spacing.xl}px ${layout.contentPaddingXMobile}px` }}>
        <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
          <Outlet />
        </div>
      </Layout.Content>
    </Layout>
  )
}
