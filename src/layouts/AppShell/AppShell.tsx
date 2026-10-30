import { MenuOutlined } from '@ant-design/icons'
import { Button, Drawer, Flex, Grid, Layout, Menu, Typography, type MenuProps } from 'antd'
import { createElement, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { BrandMark, OfflineNotice } from '@/shared/ui'
import { colors, layout, sizes, spacing, typography } from '@/styles/tokens'
import { getSession } from '@/lib/auth/session'
import { roleByApiName } from '@/shared/types/account'
import { findSelectedPath, getSurface, surfaces, workspaceSections, type NavSection, type Surface } from './navigation'
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

function Brand({ subtitle }: Readonly<{ subtitle: string }>) {
  return (
    <Flex align="center" gap={spacing.sm}>
      <BrandMark size={32} />
      <Flex vertical style={{ lineHeight: 1.25, minWidth: 0 }}>
        <Typography.Text strong style={{ fontSize: typography.cardHeading.fontSize, color: colors.textPrimary }}>
          Harmonia
        </Typography.Text>
        <Typography.Text ellipsis style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
          {subtitle}
        </Typography.Text>
      </Flex>
    </Flex>
  )
}

/**
 * Authenticated application frame: role sidebar, header with user menu, and page content.
 * The sidebar is a white panel beside the page with neutral chrome; colour is kept for the data (2026-10-30).
 * Below the md breakpoint (768px) the sidebar moves into a drawer.
 */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Role-neutral pages (Hồ sơ cá nhân) keep the signed-in user's own sidebar; RoleGuard admits only these three roles.
  const role = getSession()?.user.roleName
  const ownSurface = role ? (roleByApiName[role] as string) : undefined
  const surface =
    getSurface(location.pathname) ?? (ownSurface && ownSurface in surfaces ? (ownSurface as Surface) : undefined)
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
        style={{ borderInlineEnd: 0, background: 'transparent' }}
      />
    </nav>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
            background: colors.surface,
            borderInlineEnd: `1px solid ${colors.border}`,
            // The Choir Director menu is taller than a laptop screen: a thin, quiet scrollbar.
            scrollbarWidth: 'thin',
            scrollbarColor: `${colors.mutedBorder} transparent`,
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
            // An opaque band of the page ground (owner choice 2026-10-28), so nothing scrolling under it shows through.
            background: colors.background,
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
              : `${spacing.lg}px ${layout.contentPaddingX}px ${spacing.xl}px`,
          }}
        >
          <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
            <OfflineNotice />
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
