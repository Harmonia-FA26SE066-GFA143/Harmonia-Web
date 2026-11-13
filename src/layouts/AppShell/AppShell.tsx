import { MenuOutlined } from '@ant-design/icons'
import { Button, Drawer, Flex, Grid, Layout, Menu, type MenuProps } from 'antd'
import { createElement, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { BrandMark, OfflineNotice } from '@/shared/ui'
import { layout, sizes, spacing } from '@/styles/tokens'
import { getSession } from '@/lib/auth/session'
import { roleByApiName } from '@/shared/types/account'
import { findSelectedPath, getSurface, surfaces, workspaceSections, type NavSection, type Surface } from './navigation'
import { ChoirSwitcher } from '@/features/choirs'
import { NotificationBell } from '@/features/notifications'
import { SystemAnnouncement } from '@/features/settings'
import { HeadDay } from './HeadDay'
import { RouteStage } from './RouteStage'
import { RunningHead } from './RunningHead'
import { TaskCenter } from './TaskCenter'
import { UserMenu } from './UserMenu'
import { WorkspaceGround } from './WorkspaceGround'

const { Content } = Layout

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

function Brand() {
  return (
    <Flex align="center" gap={spacing.sm} style={{ flexShrink: 0 }}>
      <BrandMark size={28} />
      <span className="hm-brand">Harmonia</span>
    </Flex>
  )
}

/**
 * Authenticated application frame: the running head (areas, the area's pages, notifications, account) over the page
 * content and the workspace ground. Below the lg breakpoint (992px) the page list moves into a drawer.
 */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isCompact = screens.lg === false
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Role-neutral pages (Hồ sơ cá nhân) keep the signed-in user's own navigation; RoleGuard admits only these three roles.
  const role = getSession()?.user.roleName
  const ownSurface = role ? (roleByApiName[role] as string) : undefined
  const surface =
    getSurface(location.pathname) ?? (ownSurface && ownSurface in surfaces ? (ownSurface as Surface) : undefined)
  const sections = surface ? surfaces[surface].sections : workspaceSections
  const selectedPath = findSelectedPath(sections, location.pathname)

  const controls = (
    <>
      <TaskCenter />
      <NotificationBell />
      <UserMenu compact={screens.xl === false} />
    </>
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
      {isCompact ? (
        <div className="hm-head">
          <div className="hm-top">
            <Button
              className="hm-chrome-btn"
              type="text"
              icon={<MenuOutlined />}
              aria-label="Mở menu điều hướng"
              onClick={() => setDrawerOpen(true)}
              style={{ width: sizes.touchTarget, height: sizes.touchTarget }}
            />
            <Brand />
            <div className="hm-top__end">{controls}</div>
          </div>
        </div>
      ) : (
        <RunningHead
          sections={sections}
          selectedPath={selectedPath}
          brand={<Brand />}
          controls={controls}
          choir={surface === 'director' ? <ChoirSwitcher /> : undefined}
          day={<HeadDay surface={surface} />}
          scrolled={scrolled}
        />
      )}
      {!isCompact && <WorkspaceGround />}
      <Content
        id="main-content"
        tabIndex={-1}
        style={{
          position: 'relative',
          zIndex: 1,
          padding: isCompact
            ? `${spacing.lg}px ${layout.contentPaddingXMobile}px`
            : `${spacing.md}px ${layout.contentPaddingX}px ${spacing.xl}px`,
        }}
      >
        <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
          <OfflineNotice />
          <SystemAnnouncement />
          <RouteStage>
            <Outlet />
          </RouteStage>
        </div>
      </Content>
      {isCompact && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={layout.sidebarWidth}
          title="Harmonia"
          styles={{ body: { padding: `${spacing.sm}px 0` } }}
        >
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
        </Drawer>
      )}
    </Layout>
  )
}
