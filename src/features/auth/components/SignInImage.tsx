import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { BrandMark, HeroNave, visuallyHidden } from '@/shared/ui'
import { media } from '@/styles/tokens'

/**
 * The sign-in backdrop: the landing hero held still (one frame of the drawn nave, so nothing moves beside a form), its
 * giant name across the top, the brand linking home and a psalm verse at the foot.
 */
export function SignInImage() {
  return (
    <>
      <div aria-hidden className="hm-auth__scene">
        <HeroNave still />
        <div style={{ position: 'absolute', inset: 0, background: media.heroScrim }} />
      </div>
      {/* The landing's header mark, in the same place; the name is written across the page. */}
      <Link to={paths.home} viewTransition className="on-media-link hm-auth__brand hm-brand">
        <BrandMark size={36} />
        <span style={visuallyHidden}>Về trang chủ Harmonia</span>
      </Link>
      <div aria-hidden className="hm-auth__name">
        Harmonia
      </div>
      <figure className="hm-auth__verse">
        <blockquote lang="vi">
          “Hát lên mừng Chúa
          <br />
          một bài ca mới.”
        </blockquote>
        <figcaption>Thánh vịnh 96,1</figcaption>
      </figure>
    </>
  )
}
