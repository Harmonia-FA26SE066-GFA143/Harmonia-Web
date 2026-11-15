import { Typography } from 'antd'
import type { ReactNode } from 'react'
import { SignInImage } from './SignInImage'

export interface AuthCardProps {
  title: ReactNode
  description?: ReactNode
  /** Decorative icon above the title (e.g. on result screens). */
  icon?: ReactNode
  children?: ReactNode
  /** Secondary links below the form (e.g. "Quay lại đăng nhập"). */
  footer?: ReactNode
}

/**
 * Frame shared by the sign-in, password and join screens (artifact AuthPages, desktop web only): the landing hero's
 * window of light, opened to hold the form, over the still nave and the giant name. It covers the blank layout's
 * padding so the scene reaches the edges; a long form lengthens the window and the page scrolls.
 */
export function AuthCard({ title, description, icon, children, footer }: Readonly<AuthCardProps>) {
  return (
    <div className="hm-auth">
      <SignInImage />
      <section className="hm-auth__window">
        <div className="hm-auth__body">
          {icon && (
            <span aria-hidden className="hm-auth__icon">
              {icon}
            </span>
          )}
          <Typography.Title level={1} className="hm-auth__title">
            {title}
          </Typography.Title>
          {description && <Typography.Paragraph className="hm-auth__lead">{description}</Typography.Paragraph>}
          {children && <div className="hm-auth__content">{children}</div>}
          {footer && <div className="hm-auth__foot">{footer}</div>}
        </div>
      </section>
    </div>
  )
}
