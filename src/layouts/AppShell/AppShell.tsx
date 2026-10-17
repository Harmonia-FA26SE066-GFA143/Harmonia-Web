import { MenuOutlined } from '@ant-design/icons'
import { Button, Drawer, Flex, Grid, Layout, Menu, Typography, type MenuProps } from 'antd'
import { createElement, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { colors, layout, radius, sizes, spacing, typography } from '@/styles/tokens'
import { findSelectedPath, getSurface, surfaces, workspaceSections, type NavSection } from './navigation'
import { NotificationBell } from '@/features/notifications'
import { SystemAnnouncement } from '@/features/settings'
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

function BrandLogo() {
  return (
    <div
      aria-hidden
      style={{
        width: 38,
        height: 38,
        borderRadius: radius.md,
        background: 'linear-gradient(135deg, #8E3B4B 0%, #A24557 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(142, 59, 75, 0.28)',
        flexShrink: 0,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4V20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18 4V20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M6 12H18" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="7" r="1.5" fill="#F3C68F" />
        <path d="M9.5 17C11 16 13 16 14.5 17" stroke="#F3C68F" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function Brand({ subtitle }: Readonly<{ subtitle: string }>) {
  return (
    <Flex align="center" gap={spacing.sm}>
      <BrandLogo />
      <Flex vertical style={{ lineHeight: 1.25, minWidth: 0 }}>
        <Typography.Text
          strong
          style={{
            fontSize: typography.sectionHeading.fontSize,
            color: colors.primary,
            letterSpacing: '-0.02em',
          }}
        >
          Harmonia
        </Typography.Text>
        <Typography.Text
          ellipsis
          style={{
            fontSize: typography.metadata.fontSize,
            color: colors.textMuted,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography.Text>
      </Flex>
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
    <Layout style={{ minHeight: '100vh', background: colors.background }}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          // A hash link would change the route; move the focus instead.
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Bỏ qua điều hướng, đến nội dung chính
      </a>
      {!isMobile && (
        <Sider
          width={layout.sidebarWidth}
          theme="light"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
            borderInlineEnd: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '1px 0 4px 0 rgba(0, 0, 0, 0.02)',
            background: colors.surface,
          }}
        >
          <div style={{ padding: `${spacing.lg}px ${spacing.lg}px ${spacing.md}px` }}>
            <Brand subtitle={subtitle} />
          </div>
          {menu}
        </Sider>
      )}
      <Layout style={{ background: 'transparent' }}>
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
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
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
          <Flex align="center" gap={spacing.sm} style={{ marginInlineStart: 'auto' }}>
            <NotificationBell />
            <UserMenu compact={isMobile} />
          </Flex>
        </Header>
        <Content
          id="main-content"
          tabIndex={-1}
          style={{
            padding: isMobile
              ? `${spacing.lg}px ${layout.contentPaddingXMobile}px`
              : `${spacing.xl}px ${layout.contentPaddingX}px`,
          }}
        >
          <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
            <SystemAnnouncement />
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
