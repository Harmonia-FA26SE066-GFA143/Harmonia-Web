import { Typography } from 'antd'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { BrandMark, HeroNave } from '@/shared/ui'
import { media, spacing, typography } from '@/styles/tokens'

/** Width of the form panel in `AuthCard`; the scene is centred in what is left. */
const panelWidth = 520

/**
 * The sign-in backdrop: the same drawn nave as the landing, one still frame so nothing moves beside a form, with the
 * brand at the top and a psalm verse at the foot.
 */
export function SignInImage() {
  return (
    <>
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: media.backdrop }}>
        <div style={{ position: 'absolute', inset: `0 ${panelWidth}px 0 0` }}>
          <HeroNave still />
          <div style={{ position: 'absolute', inset: 0, background: media.signInScrim }} />
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${spacing.xl}px ${spacing.xxl}px`, minHeight: '100vh' }}>
        <Link to={paths.home} className="on-media-link" style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', textDecoration: 'none' }}>
          <BrandMark size={40} />
          <Typography.Text strong style={{ fontSize: 18, color: media.text }}>
            Harmonia
          </Typography.Text>
        </Link>
        <figure style={{ margin: 0, maxWidth: 620 }}>
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
