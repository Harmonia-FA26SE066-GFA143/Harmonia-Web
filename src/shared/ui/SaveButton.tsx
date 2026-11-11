import { CheckOutlined } from '@ant-design/icons'
import { Button, type ButtonProps } from 'antd'

/**
 * A save button that answers in its own place: "Đã lưu" for a moment after `saved` (see `useJustSaved`). Both labels
 * share one grid cell, so the button keeps its width. For saves that stay on the page; a form that closes does not need it.
 */
export function SaveButton({ saved, children, ...props }: Readonly<ButtonProps & { saved: boolean }>) {
  return (
    <Button {...props}>
      <span className="hm-save-label">
        <span className={saved ? 'is-hidden' : undefined} aria-hidden={saved}>{children}</span>
        {saved && (
          <span className="hm-pop">
            <CheckOutlined aria-hidden /> Đã lưu
          </span>
        )}
      </span>
    </Button>
  )
}
