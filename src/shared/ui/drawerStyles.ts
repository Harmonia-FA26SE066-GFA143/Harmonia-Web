import type { DrawerProps } from 'antd'
import { spacing } from '@/styles/tokens'

const bodyClearance = { paddingBottom: spacing.lg, scrollPaddingBottom: spacing.lg }

/**
 * Adds the 24px bottom body clearance shared by `FormDrawer` and `ViewDrawer` to caller `styles` (object or function
 * form), so the last field never clips under the sticky footer. A caller's own `body` values still win.
 */
export function withBodyClearance(styles: DrawerProps['styles']): DrawerProps['styles'] {
  if (typeof styles === 'function') {
    return (info) => {
      const base = styles(info) ?? {}
      return { ...base, body: { ...bodyClearance, ...base.body } }
    }
  }
  return { ...styles, body: { ...bodyClearance, ...styles?.body } }
}
