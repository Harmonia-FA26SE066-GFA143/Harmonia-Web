import { Button, Drawer, Flex, type ButtonProps, type DrawerProps } from 'antd'
import type { ReactNode } from 'react'
import { spacing } from '@/styles/tokens'

export interface FormDrawerProps extends Omit<DrawerProps, 'footer' | 'onClose' | 'mask' | 'maskClosable' | 'keyboard' | 'closable'> {
  okText: ReactNode
  cancelText?: ReactNode
  okButtonProps?: ButtonProps
  cancelButtonProps?: ButtonProps
  /** Omitted when the drawer wraps a Form (`drawerRender`) and the action is its submit button. */
  onOk?: () => void
  onCancel: () => void
  /** Runs once the drawer has finished closing, e.g. to reset local state. */
  afterClose?: () => void
}

/**
 * Create/edit work that keeps the page in view: a panel from the right with Cancel and the action in its footer, the
 * modal-like API the forms already used. While the action is loading it cannot be closed (Escape, mask, ×, Cancel),
 * so a request in flight is not abandoned. Focus stays inside and returns to the trigger on close (antd defaults).
 * Confirmations of one decision (delete, sign out, send) stay a Modal.
 */
export function FormDrawer({
  okText,
  cancelText = 'Hủy',
  okButtonProps,
  cancelButtonProps,
  onOk,
  onCancel,
  afterClose,
  size = 480,
  ...props
}: Readonly<FormDrawerProps>) {
  const busy = Boolean(okButtonProps?.loading)
  return (
    <Drawer
      size={size}
      onClose={onCancel}
      closable={!busy}
      keyboard={!busy}
      mask={{ closable: !busy }}
      afterOpenChange={(open) => {
        if (!open) afterClose?.()
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
