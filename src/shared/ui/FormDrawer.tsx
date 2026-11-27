import { Button, Drawer, Flex, type ButtonProps, type DrawerProps } from 'antd'
import type { ReactNode, RefObject } from 'react'
import { component, spacing } from '@/styles/tokens'
import { withBodyClearance } from './drawerStyles'
import { CANCEL_LABEL } from './glossary'

export type DrawerWidthTier = (typeof component.drawer)[keyof typeof component.drawer]

export interface FormDrawerProps
  extends Omit<DrawerProps, 'footer' | 'onClose' | 'mask' | 'maskClosable' | 'keyboard' | 'closable' | 'size'> {
  /** Standard tiers: 480 (sm), 640 (md), 720 (lg). Literal numbers kept only for gradual M5/M6 migration. */
  size?: DrawerWidthTier | (number & {})
  okText: ReactNode
  cancelText?: ReactNode
  okButtonProps?: ButtonProps
  cancelButtonProps?: ButtonProps
  /** Omitted when the drawer wraps a Form (`drawerRender`) and the action is its submit button. */
  onOk?: () => void
  onCancel: () => void
  /** Runs once the drawer has finished closing, e.g. to reset local state. */
  afterClose?: () => void
  /** Optional first editable input ref focused automatically when the drawer opens (G3-13). */
  initialFocusRef?: RefObject<{ focus?: () => void } | null>
}

/**
 * Right-docked create/edit drawer contract (R4.2, SYS-07, G3-13, G4-17):
 * - Always `placement="right"`, standard width tiers `480 | 640 | 720` (`component.drawer`).
 * - Flush-right `×` close & flush-left `title` (styled globally via `.ant-drawer-header-title`).
 * - `title` must match the opener button's action label (e.g. `"Thêm buổi tập"`).
 * - Body includes `24px` bottom padding & `scrollPaddingBottom` so the last field never clips under the sticky footer.
 *
 * Modal vs. Drawer vs. Dedicated Page decision matrix (`02-ux-architecture.md` §5.2):
 * - **Modal**: Single-decision confirmation, destructive action, or irreversible status lock (never multi-field forms).
 * - **Drawer (`FormDrawer` / `ViewDrawer`)**: Create/edit/inspect/pick flows (1–8 fields or secondary lookup) keeping parent context visible.
 * - **Dedicated Page**: Full-workspace multi-section authoring, split studio/chat, or deep hierarchical entities with URL shareability.
 */
export function FormDrawer({
  open,
  okText,
  cancelText = CANCEL_LABEL,
  okButtonProps,
  cancelButtonProps,
  onOk,
  onCancel,
  afterClose,
  afterOpenChange,
  initialFocusRef,
  placement = 'right',
  size = component.drawer.sm,
  styles,
  ...props
}: Readonly<FormDrawerProps>) {
  const busy = Boolean(okButtonProps?.loading)

  return (
    <Drawer
      open={open}
      placement={placement}
      size={size}
      onClose={onCancel}
      closable={busy ? false : { 'aria-label': 'Đóng bảng' }}
      keyboard={!busy}
      mask={{ closable: false }}
      styles={withBodyClearance(styles)}
      afterOpenChange={(open) => {
        // Fires after the open motion, also when mounted with open={true}, and after the drawer's own panel focus.
        if (open) initialFocusRef?.current?.focus?.()
        else afterClose?.()
        afterOpenChange?.(open)
      }}
      footer={
        <Flex justify="flex-end" gap={spacing.sm}>
          <Button disabled={busy} {...cancelButtonProps} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="primary" {...okButtonProps} onClick={onOk}>
            {okText}
          </Button>
        </Flex>
      }
      {...props}
    />
  )
}
