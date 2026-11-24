import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { BrandMark, Incipit } from '@/shared/ui'

export interface StatusPageProps {
  /** Browser tab title. */
  tabTitle: string
  picture: ReactNode
  /** The rubric over the title, e.g. "Lỗi 404". */
  code: string
  title: string
  description: string
  /** Primary action first. */
  actions: ReactNode
  /** When true (rendered inside `AppShell`), omits the standalone brand link and full-viewport padding (R2.8). */
  inShell?: boolean
}

/**
 * 404, 403 and the render error (artifact StatusPages): standalone when unauthenticated, or hosted cleanly inside
 * `AppShell` when authenticated (`inShell`).
 */
export function StatusPage({ tabTitle, picture, code, title, description, actions, inShell = false }: Readonly<StatusPageProps>) {
  const LeafTag = inShell ? 'div' : 'main'
  return (
    <div className={inShell ? 'hm-status hm-status--in-shell' : 'hm-status'}>
      <title>{`${tabTitle} · Harmonia`}</title>
      {!inShell && (
        <Link to={paths.home} className="hm-status__brand">
          <BrandMark size={32} />
          Harmonia
        </Link>
      )}
      <LeafTag className="hm-status__leaf">
        <Flex justify="center" style={{ marginBottom: 16 }}>
          {picture}
        </Flex>
        <Flex justify="center" style={{ marginBottom: 8 }}>
          <Incipit />
        </Flex>
        <p className="hm-status__code">{code}</p>
        <Typography.Title level={1} className="hm-status__title">
          {title}
        </Typography.Title>
        <Typography.Paragraph className="hm-status__lead">{description}</Typography.Paragraph>
        <Flex wrap justify="center" gap={8} style={{ marginTop: 32 }}>
          {actions}
        </Flex>
      </LeafTag>
    </div>
  )
}
