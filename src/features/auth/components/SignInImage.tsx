import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import apseLancets from '@/assets/images/brand/parish-apse-lancets.webp'
import vaultArcade from '@/assets/images/brand/parish-vault-arcade.webp'
import { BrandMark, visuallyHidden } from '@/shared/ui'
import { media } from '@/styles/tokens'

export type AuthScene = 'vault' | 'apse'

const scenes: Record<AuthScene, { src: string; position: string }> = {
  vault: { src: vaultArcade, position: 'center 20%' },
  apse: { src: apseLancets, position: 'center 24%' },
}

/**
 * The sign-in and registration backdrop: real architecture of the parish church held still behind the dark window,
 * its giant name across the top, the brand linking home and a psalm verse at the foot.
 */
export function SignInImage({ scene = 'vault' }: Readonly<{ scene?: AuthScene }>) {
  const { src, position } = scenes[scene]
  return (
    <>
      <div aria-hidden className="hm-auth__scene">
        <img
          src={src}
          alt=""
          decoding="async"
          className="hm-auth__photo"
          style={{ objectPosition: position }}
        />
        <div style={{ position: 'absolute', inset: 0, background: media.heroScrim }} />
        <div className="hm-auth__vignette" />
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
