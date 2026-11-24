import type { CSSProperties } from 'react'
import { sizes } from '@/styles/tokens'
import { iconRegistry, type IconName } from './registry'

export type IconSize = keyof typeof sizes.icon | number

export type IconProps = {
  name: IconName
  /** A token key or pixels; omitted, the icon follows the surrounding text (`1em`). */
  size?: IconSize
  /** Names a standalone icon for screen readers; without it the icon is decoration and hidden. */
  label?: string
  className?: string
  style?: CSSProperties
}

function toFontSize(size?: IconSize) {
  if (size === undefined) return '1em'
  const pixels = typeof size === 'number' ? size : sizes.icon[size]
  return `${pixels}px`
}

/** One Harmonia icon. `anticon` keeps Ant Design's spacing for icons in Button, Menu and Alert. */
export function Icon({ name, size, label, className, style }: Readonly<IconProps>) {
  return (
    <span
      className={className ? `hm-icon anticon ${className}` : 'hm-icon anticon'}
      style={{ fontSize: toFontSize(size), ...style }}
      aria-hidden={label ? undefined : true}
    >
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        {iconRegistry[name]}
      </svg>
    </span>
  )
}
