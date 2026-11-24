import type { DrawerProps } from 'antd'
import { spacing } from '@/styles/tokens'

const bodyClearance = { paddingBottom: spacing.lg, scrollPaddingBottom: spacing.lg }
/** The 480 / 640 / 720 tiers never get wider than the window. */
const viewportClamp = { maxWidth: '100vw' }

/**
 * Adds the 24px bottom body clearance shared by `FormDrawer` and `ViewDrawer` to caller `styles` (object or function
 * form), so the last field never clips under the sticky footer, and clamps the panel to the window width. A caller's
 * own `body` and `wrapper` values still win.
 */
export function withBodyClearance(styles: DrawerProps['styles']): DrawerProps['styles'] {
  if (typeof styles === 'function') {
    return (info) => {
      const base = styles(info) ?? {}
      return { ...base, wrapper: { ...viewportClamp, ...base.wrapper }, body: { ...bodyClearance, ...base.body } }
    }
  }
  return {
    ...styles,
    wrapper: { ...viewportClamp, ...styles?.wrapper },
    body: { ...bodyClearance, ...styles?.body },
  }
}
