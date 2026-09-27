import { Layout } from 'antd'
import { Outlet } from 'react-router'
import { layout, spacing } from '@/styles/tokens'

/** Frame for pages outside the application shell: landing page, sign-in, registration, password recovery. */
export function BlankLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: `${spacing.xl}px ${layout.contentPaddingXMobile}px` }}>
        <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
          <Outlet />
        </div>
      </Layout.Content>
    </Layout>
  )
}
