import { App, Checkbox, Flex, Modal, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { spacing } from '@/styles/tokens'
import { useSignOut } from '../hooks/useAuthMutations'

/** Confirms sign-out, then returns to sign-in. Used by the profile page and the header user menu. */
export function SignOutModal({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const signOut = useSignOut()
  const [everywhere, setEverywhere] = useState(false)

  // signOut always ends the local session, so it does not fail.
  const handleSignOut = () =>
    signOut.mutate(everywhere, {
      onSuccess: () => {
        navigate(paths.login)
        message.success(everywhere ? 'Đã đăng xuất khỏi mọi thiết bị.' : 'Đã đăng xuất.')
      },
    })

  return (
    <Modal
      open={open}
      title="Đăng xuất khỏi Harmonia?"
      okText="Đăng xuất"
      cancelText="Ở lại"
      confirmLoading={signOut.isPending}
      onOk={handleSignOut}
      onCancel={onClose}
      afterClose={() => setEverywhere(false)}
    >
      <Flex vertical gap={spacing.sm}>
        <Typography.Text>Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng Harmonia.</Typography.Text>
        <Checkbox checked={everywhere} onChange={(event) => setEverywhere(event.target.checked)}>
          Đăng xuất khỏi mọi thiết bị, kể cả ứng dụng di động
        </Checkbox>
      </Flex>
    </Modal>
  )
}
