import { Tag, type TagProps } from 'antd'
import { useState, type ReactNode } from 'react'
import { colors, semantic } from '@/styles/tokens'

/** The Ant Design preset names the status maps already use; `processing` reads as blue. */
export type StatusTagColor = 'default' | 'green' | 'gold' | 'red' | 'orange' | 'blue' | 'processing'

export interface StatusTagProps extends Omit<TagProps, 'color' | 'children'> {
  color?: StatusTagColor
  /**
   * The printed mark of the state (songbook world, 2026-10-28): `draft` is a dashed outline with no fill, `struck` is
   * struck through (cancelled). Without it the tag is filled.
   */
  mark?: 'draft' | 'struck'
  children: ReactNode
}

/**
 * Status label as the Design System StatusTag draws it: the status tint as ground with its ink as text and edge (each
 * ink 5:1 or more on its tint), a dashed control edge for a draft, struck-through muted text on the soft surface for a
 * cancelled state. The label, not the color, still carries the meaning.
 */
export function StatusTag({ color = 'default', mark, style, className, children, ...props }: Readonly<StatusTagProps>) {
  // A state that changes while the tag is on screen pops once (DESIGN "Motion": StatusTag); the first render does not.
  const state = `${color}|${mark ?? ''}|${typeof children === 'string' ? children : ''}`
  const [tracked, setTracked] = useState({ prev: state, generation: 0 })
  if (tracked.prev !== state) {
    setTracked({ prev: state, generation: tracked.generation + 1 })
  }
  const changed = tracked.generation > 0
  // [text, background, border]: the Design System StatusTag, a tint ground with its ink as text and edge.
  const { status, area } = semantic
  const tones = {
    default: [colors.textBody, colors.softSurface, colors.border],
    green: [status.success, status.successTint, status.success],
    gold: [status.warning, status.warningTint, status.warning],
    red: [status.error, status.errorTint, status.error],
    orange: [area.roster.ink, area.roster.tint, area.roster.cloth],
    blue: [status.info, status.infoTint, status.info],
  } as const
  const [toneText, toneBackground, toneBorder] = tones[color === 'processing' ? 'blue' : color]
  // Draft: a dashed control edge and no fill. Cancelled: struck through, muted, on the soft surface.
  const marked = { draft: [colors.textBody, 'transparent'], struck: [colors.textMuted, colors.softSurface] } as const
  const [text, background] = mark ? marked[mark] : [toneText, toneBackground]
  const border = mark ? colors.controlBorder : toneBorder

  return (
    <Tag
      key={changed ? tracked.generation : undefined}
      className={[className, changed && 'hm-pop'].filter(Boolean).join(' ') || undefined}
      style={{
        borderRadius: 9999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '18px',
        letterSpacing: '0.01em',
        color: text,
        background,
        borderColor: border,
        borderStyle: mark === 'draft' ? 'dashed' : 'solid',
        textDecoration: mark === 'struck' ? 'line-through' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
