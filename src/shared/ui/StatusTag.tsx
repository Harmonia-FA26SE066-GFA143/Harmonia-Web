import { Tag, theme, type TagProps } from 'antd'
import type { ReactNode } from 'react'
import { colors } from '@/styles/tokens'

/** The Ant Design preset names the status maps already use; `processing` reads as blue. */
export type StatusTagColor = 'default' | 'green' | 'gold' | 'red' | 'orange' | 'blue' | 'processing'

export interface StatusTagProps extends Omit<TagProps, 'color' | 'children'> {
  color?: StatusTagColor
  children: ReactNode
}

/**
 * Status label with a text color dark enough to read (4.5:1 or more on its light background). The Ant Design preset
 * tags put the -7 shade on the -1 background: green 3.4:1 and gold 2.8:1 fall short, so those use the -8 / -9 shade.
 * The label, not the color, still carries the meaning.
 */
export function StatusTag({ color = 'default', style, children, ...props }: Readonly<StatusTagProps>) {
  const { token } = theme.useToken()
  // [text, background, border]
  const tones = {
    default: ['#4B5563', colors.softSurface, colors.border],
    green: [token.green8, token.green1, token.green3],
    gold: [token.gold9, token.gold1, token.gold3],
    red: [token.red8, token.red1, token.red3],
    orange: [token.orange8, token.orange1, token.orange3],
    blue: [token.blue7, token.blue1, token.blue3],
  } as const
  const [text, background, border] = tones[color === 'processing' ? 'blue' : color]

  return (
    <Tag
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
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}
