import { Button, Drawer, Flex, Grid, Layout, Menu, type MenuProps } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { BrandMark, Icon, OfflineNotice } from '@/shared/ui'
import { layout, sizes, spacing } from '@/styles/tokens'
import { useSession } from '@/lib/auth/session'
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
      icon: <Icon name={item.icon} />,
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
 *
 * On `/change-password`, enters Focused Security Mode when the user must replace their initial password
 * (`isPasswordChangeRequired`) or when there is no session (the confirmation after a completed change): renders only
 * the 52px Bookcloth bar with Brand (+ a sign-out-only UserMenu while a session exists) and suppresses workspace
 * navigation/widgets so zero forbidden background API requests fire.
 */
export function AppShell({ children }: Readonly<{ children?: ReactNode }>) {
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

  // Reactive: clearSession() after a voluntary password change switches straight to Focused Security Mode.
  const session = useSession()
  const role = session?.user.roleName
  // Stay in Focused Security Mode on /change-password after clearSession() clears the session post-submit so
  // re-renders (e.g. scroll) never drop into full workspace chrome or fire unauthenticated header queries.
  const focusedSecurity =
    location.pathname === paths.changePassword && (!session || Boolean(session.user.isPasswordChangeRequired))
  const ownSurface = role ? (roleByApiName[role] as string) : undefined
  const resolvedOwnSurface = ownSurface && ownSurface in surfaces ? (ownSurface as Surface) : undefined
  // Signed-in users always keep their own role's navigation (even when landing on a 403 cross-role URL).
  const surface = resolvedOwnSurface ?? getSurface(location.pathname)
  const sections = surface ? surfaces[surface].sections : workspaceSections
  const selectedPath = findSelectedPath(sections, location.pathname)

  // After clearSession() there is nobody to sign out (logout would go out without a token); the page's own
  // "Đăng nhập" call to action is the way back, so the bar shows only the brand.
  const controls = focusedSecurity ? (
    session && <UserMenu compact={screens.xl === false} focusedSecurityMode />
  ) : (
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
      {focusedSecurity ? (
        <div className="hm-head">
          <div className="hm-top">
            <Brand />
            <div className="hm-top__end">{controls}</div>
          </div>
        </div>
      ) : isCompact ? (
        <div className="hm-head">
          <div className="hm-top">
            <Button
              className="hm-chrome-btn"
              type="text"
              icon={<Icon name="menu" />}
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
        // Its stacking (position, z-index 1 under the sticky head) is in global.css, so the practice room's focus mode
        // can lift it over the head without !important.
        className="hm-main"
        style={{
          padding: isCompact
            ? `${spacing.lg}px ${layout.contentPaddingXMobile}px`
            : `${spacing.lg}px ${layout.contentPaddingX}px ${spacing.xl}px`,
        }}
      >
        <div style={{ maxWidth: layout.contentMaxWidth, marginInline: 'auto' }}>
          <OfflineNotice />
          {!focusedSecurity && <SystemAnnouncement />}
          <RouteStage>{children ?? <Outlet />}</RouteStage>
        </div>
      </Content>
      {isCompact && !focusedSecurity && (
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
