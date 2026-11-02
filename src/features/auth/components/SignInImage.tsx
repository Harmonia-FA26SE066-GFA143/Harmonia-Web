import { Typography } from 'antd'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import churchInterior from '@/assets/images/auth/church-interior-960.webp'
import { BrandMark } from '@/shared/ui'
import { media, spacing, typography } from '@/styles/tokens'

/**
 * The sign-in backdrop: a church interior (decorative) across the window, darkened toward the form, with the brand at
 * the top and a psalm verse at the foot.
 */
export function SignInImage() {
  return (
    <>
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: media.backdrop }}>
        <img
          src={churchInterior}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: media.signInScrim }} />
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${spacing.xl}px ${spacing.xxl}px`, minHeight: '100vh' }}>
        <Link to={paths.home} className="on-media-link" style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', textDecoration: 'none' }}>
          <BrandMark size={40} />
          <Typography.Text strong style={{ fontSize: 18, color: media.text }}>
            Harmonia
          </Typography.Text>
        </Link>
        <figure style={{ margin: 0, maxWidth: 620, textShadow: '0 1px 12px rgba(0, 0, 0, 0.45)' }}>
          <blockquote lang="vi" style={{ margin: 0, fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 44, lineHeight: 1.15, color: media.text }}>
            “Hát lên mừng Chúa{' '}
            <br />
            một bài ca mới.”
          </blockquote>
          <figcaption style={{ marginTop: spacing.sm, color: media.textMuted }}>Thánh vịnh 96,1</figcaption>
        </figure>
      </div>
    </>
  )
}
