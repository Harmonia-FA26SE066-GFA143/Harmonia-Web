import { AimOutlined } from '@ant-design/icons'
import { Button } from 'antd'

/** Shown while the sheet no longer follows the sounding note (the user scrolled): one press goes back to it and follows again. */
export function FollowButton({ onClick }: Readonly<{ onClick: () => void }>) {
  // The visible text "Theo dõi" is the start of the name, so voice control and screen readers agree.
  return (
    <Button icon={<AimOutlined />} aria-label="Theo dõi nốt đang hát" onClick={onClick}>
      Theo dõi
    </Button>
  )
}
