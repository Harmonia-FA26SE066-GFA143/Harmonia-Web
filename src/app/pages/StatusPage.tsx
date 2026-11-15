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
}

/**
 * 404, 403 and the render error (artifact StatusPages): they stand outside the workspace shell, so the page carries
 * the brand itself and sets its message on one reading leaf in the middle of the viewport.
 */
export function StatusPage({ tabTitle, picture, code, title, description, actions }: Readonly<StatusPageProps>) {
  return (
    <div className="hm-status">
      <title>{`${tabTitle} · Harmonia`}</title>
      <Link to={paths.home} className="hm-status__brand">
        <BrandMark size={32} />
        Harmonia
      </Link>
      <main className="hm-status__leaf">
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
      </main>
    </div>
  )
}
