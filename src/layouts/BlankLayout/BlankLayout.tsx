import { Layout } from 'antd'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { clearPasswordChangeCompleted } from '@/lib/auth/session'
import { colors, layout, spacing } from '@/styles/tokens'

/** Frame for pages outside the application shell: landing page, sign-in, registration, password recovery. */
export function BlankLayout() {
  useEffect(() => {
    clearPasswordChangeCompleted()
  }, [])

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: colors.background,
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
