import { Typography } from 'antd'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import churchInterior from '@/assets/images/auth/church-interior-960.webp'
import { BrandMark } from '@/shared/ui'
import { media, radius, spacing, typography } from '@/styles/tokens'

/** Left column of the sign-in page: a church interior (decorative) with the brand over its darkened foot. */
export function SignInImage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: radius.lg, minHeight: 560 }}>
      <img
        src={churchInterior}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
      />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: media.imageScrim }} />
      <Link
        to={paths.home}
        className="on-media-link"
        style={{ position: 'absolute', insetInline: spacing.xl, insetBlockEnd: spacing.xl, textDecoration: 'none' }}
      >
        <BrandMark size={44} style={{ marginBottom: spacing.sm }} />
        <Typography.Text strong style={{ display: 'block', fontSize: 26, color: media.text, letterSpacing: '-0.02em' }}>
          Harmonia
        </Typography.Text>
        <Typography.Text style={{ fontSize: typography.cardHeading.fontSize, color: media.textMuted }}>
          Điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Text>
      </Link>
    </div>
  )
}
