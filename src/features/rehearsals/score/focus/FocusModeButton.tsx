import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import type { Ref } from 'react'

/**
 * Turns focus mode on and off. One toggle button with one name: the pressed state says which way it goes, and the icon
 * follows it (changing the name as well would announce "pressed" and a new name at once).
 */
export function FocusModeButton({
  active,
  onToggle,
  buttonRef,
}: Readonly<{ active: boolean; onToggle: () => void; buttonRef: Ref<HTMLButtonElement> }>) {
  return (
    <Tooltip title={`${active ? 'Thoát' : 'Bật'} chế độ tập trung (F)`}>
      <Button
        ref={buttonRef}
        className="hm-lift"
        icon={active ? <FullscreenExitOutlined aria-hidden /> : <FullscreenOutlined aria-hidden />}
        aria-pressed={active}
        aria-keyshortcuts="F"
        onClick={onToggle}
      >
        Chế độ tập trung
      </Button>
    </Tooltip>
  )
}
