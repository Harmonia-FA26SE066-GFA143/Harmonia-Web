import { Button, type ButtonProps } from 'antd'
import { Icon } from './icons'

/**
 * A save button that answers in its own place: "Đã lưu" for a moment after `saved` (see `useJustSaved`). Both labels
 * share one grid cell, so the button keeps its width. For saves that stay on the page; a form that closes does not need it.
 */
export function SaveButton({ saved, icon, children, ...props }: Readonly<ButtonProps & { saved: boolean }>) {
  return (
    <Button {...props} icon={saved ? undefined : icon}>
      <span className="hm-save-label">
        <span className={saved ? 'is-hidden' : undefined} aria-hidden={saved}>
          {children}
        </span>
        <span className={saved ? 'hm-save-label__saved hm-pop' : 'hm-save-label__saved is-hidden'} aria-hidden={!saved} aria-live="polite">
          <Icon name="check" /> Đã lưu
        </span>
      </span>
    </Button>
  )
}
