import { Button, Drawer, Flex, type DrawerProps } from 'antd'
import type { ReactNode } from 'react'
import { component } from '@/styles/tokens'
import { withBodyClearance } from './drawerStyles'
import type { DrawerWidthTier } from './FormDrawer'
import { CLOSE_LABEL } from './glossary'

export interface ViewDrawerProps extends Omit<DrawerProps, 'onClose' | 'size'> {
  /** Standard tiers: 480 (sm), 640 (md), 720 (lg). */
  size?: DrawerWidthTier | (number & {})
  onClose: () => void
  /** Optional custom footer; pass `null` to omit the footer, or omit for the default "Đóng" button. */
  footer?: ReactNode
  closeText?: ReactNode
}

/**
 * Right-docked read-only / inspection drawer contract (R4.2, SYS-07, G2-09, G4-17):
 * Shares `placement="right"`, `480 | 640 | 720` tiers, flush-right `×` close, and `24px` bottom body clearance.
 */
export function ViewDrawer({
  onClose,
  placement = 'right',
  size = component.drawer.md,
  footer,
  closeText = CLOSE_LABEL,
  styles,
  ...props
}: Readonly<ViewDrawerProps>) {
  const resolvedFooter =
    footer === undefined ? (
      <Flex justify="flex-end">
        <Button onClick={onClose}>{closeText}</Button>
      </Flex>
    ) : (
      footer
    )

  return (
    <Drawer
      placement={placement}
      size={size}
      onClose={onClose}
      closable={{ 'aria-label': 'Đóng bảng' }}
      styles={withBodyClearance(styles)}
      footer={resolvedFooter}
      {...props}
    />
  )
}
