import { MenuOutlined } from '@ant-design/icons'
import { Button, Drawer, Flex, Grid, Layout, Menu, Typography, type MenuProps } from 'antd'
import { createElement, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { colors, layout, sizes, spacing, typography } from '@/styles/tokens'
import { findSelectedPath, getSurface, surfaces, workspaceSections, type NavSection } from './navigation'
import { UserMenu } from './UserMenu'

const { Header, Sider, Content } = Layout

function toMenuItems(sections: NavSection[]): MenuProps['items'] {
  return sections.map((section) => ({
    type: 'group',
    key: section.label,
    label: section.label,
    children: section.items.map((item) => ({
      key: item.path,
      icon: createElement(item.icon),
      label: item.label,
    })),
  }))
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <Flex vertical style={{ lineHeight: 1.3 }}>
      <Typography.Text strong style={{ fontSize: typography.sectionHeading.fontSize, color: colors.primary }}>
        Harmonia
      </Typography.Text>
      <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>{subtitle}</Typography.Text>
    </Flex>
  )
}

/**
 * Authenticated application frame: role sidebar, header with user menu, and page content.
 * Below the md breakpoint (768px) the sidebar moves into a drawer.
 */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const [drawerOpen, setDrawerOpen] = useState(false)

  const surface = getSurface(location.pathname)
  const sections = surface ? surfaces[surface].sections : workspaceSections
  const selectedPath = findSelectedPath(sections, location.pathname)
  const subtitle = surface ? surfaces[surface].label : 'Điều phối ca đoàn'

  const menu = (
    <nav aria-label="Điều hướng chính">
      <Menu
        mode="inline"
        items={toMenuItems(sections)}
        selectedKeys={selectedPath ? [selectedPath] : []}
        onClick={({ key }) => {
          setDrawerOpen(false)
          navigate(key)
        }}
        style={{ borderInlineEnd: 0, paddingInline: spacing.sm }}
      />
    </nav>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          width={layout.sidebarWidth}
          theme="light"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
            borderInlineEnd: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ padding: `${spacing.lg}px ${spacing.lg}px ${spacing.md}px` }}>
            <Brand subtitle={subtitle} />
          </div>
          {menu}
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            paddingInline: isMobile ? layout.contentPaddingXMobile : layout.contentPaddingX,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Flex align="center" gap={spacing.sm} style={{ minWidth: 0 }}>
            {isMobile && (
              <>
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  aria-label="Mở menu điều hướng"
                  onClick={() => setDrawerOpen(true)}
                  style={{ width: sizes.touchTarget, height: sizes.touchTarget }}
                />
                <Brand subtitle={subtitle} />
              </>
            )}
          </Flex>
          <div style={{ marginInlineStart: 'auto' }}>
            <UserMenu surface={surface} />
          </div>
        </Header>
        <Content
          style={{
            padding: isMobile
              ? `${spacing.lg}px ${layout.contentPaddingXMobile}px`
              : `${spacing.xl}px ${layout.contentPaddingX}px`,
          }}
        >
          <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={layout.sidebarWidth}
          title={<Brand subtitle={subtitle} />}
          styles={{ body: { padding: `${spacing.sm}px 0` } }}
        >
          {menu}
        </Drawer>
      )}
    </Layout>
  )
}
