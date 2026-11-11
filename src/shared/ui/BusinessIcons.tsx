import Icon from '@ant-design/icons'
import type { GetProps } from 'antd'
import type { ReactNode, SVGProps } from 'react'

type IconProps = Omit<GetProps<typeof Icon>, 'component'>

/** The drawing itself; the Icon around it carries the name (or hides it), so the svg stays out of the reading. */
function GlyphSvg(props: Readonly<SVGProps<SVGSVGElement>>) {
  return <svg aria-hidden width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props} />
}

/** Harmonia's own icons, drawn to sit beside Ant Design Outlined: 24 grid, 1.5 stroke, `currentColor`, sized by `1em`. */
function Glyph({ children, ...props }: Readonly<IconProps & { children: ReactNode }>) {
  // Ant Design passes the children on to `component`.
  return (
    <Icon {...props} component={GlyphSvg}>
      {children}
    </Icon>
  )
}

// A voice part is its letter in a square note.
const note = <rect x="3" y="3" width="18" height="18" rx="2" />

export function SopranoOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}>{note}<path d="M15 9.2C14.4 8.2 13.3 7.6 12 7.6c-1.8 0-3 .9-3 2.2 0 3 6.2 1.6 6.2 4.5 0 1.3-1.3 2.2-3.2 2.2-1.4 0-2.6-.6-3.3-1.7" /></Glyph>
}

export function AltoOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}>{note}<path d="m8 17 4-10 4 10M9.4 13.6h5.2" /></Glyph>
}

export function TenorOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}>{note}<path d="M7.8 7.5h8.4M12 7.5V17" /></Glyph>
}

export function BassOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}>{note}<path d="M9 12h3.3c1.4 0 2.3-.8 2.3-2.2 0-1.4-1-2.3-2.4-2.3H9V17h3.7c1.7 0 2.8-1 2.8-2.6 0-1.4-1-2.4-2.6-2.4" /></Glyph>
}

/** The missal ribbon of a liturgical season. */
export function SeasonOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}><path d="M7 3h10v18l-5-3.6L7 21Z" /></Glyph>
}

/** A roll-call sheet: two names, one ticked. */
export function AttendanceOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m7.5 8.5 1.3 1.3 2.4-2.6M14 8.8h3M8 15.2h3M14 15.2h3" /></Glyph>
}

/** A leaf of music: a staff and a note. */
export function SheetMusicOutlined(props: Readonly<IconProps>) {
  return <Glyph {...props}><path d="M6 3h9l4 4v14H6Z" /><path d="M15 3v4h4M9 11h7M9 14h7" /><path d="M12.5 17.5v-6" /><circle cx="11" cy="17.5" r="1.5" /></Glyph>
}

const parts = [
  { pattern: /soprano|nữ cao/i, Part: SopranoOutlined },
  { pattern: /alto|nữ trầm/i, Part: AltoOutlined },
  { pattern: /tenor|nam cao/i, Part: TenorOutlined },
  { pattern: /bass|nam trầm/i, Part: BassOutlined },
]

/** The icon of a voice part named in words; nothing for an instrument or any other skill. */
export function VoicePartIcon({ name }: Readonly<{ name: string }>) {
  const match = parts.find(({ pattern }) => pattern.test(name))
  return match ? <match.Part aria-hidden /> : null
}
