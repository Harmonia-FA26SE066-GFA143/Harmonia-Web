import { Tag, theme, type TagProps } from 'antd'
import type { ReactNode } from 'react'

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
export function StatusTag({ color = 'default', style, children, ...props }: StatusTagProps) {
  const { token } = theme.useToken()
  if (color === 'default') {
    return (
      <Tag style={style} {...props}>
        {children}
      </Tag>
    )
  }

  // [text, background, border]
  const tones = {
    green: [token.green8, token.green1, token.green3],
    gold: [token.gold9, token.gold1, token.gold3],
    red: [token.red8, token.red1, token.red3],
    orange: [token.orange8, token.orange1, token.orange3],
    blue: [token.blue7, token.blue1, token.blue3],
  } as const
  const [text, background, border] = tones[color === 'processing' ? 'blue' : color]

  return (
    <Tag style={{ color: text, background, borderColor: border, ...style }} {...props}>
      {children}
    </Tag>
  )
}
