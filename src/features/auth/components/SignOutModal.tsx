import { App, Modal } from 'antd'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useSignOut } from '../hooks/useAuthMutations'

/** Confirms sign-out, then returns to sign-in. Used by the profile page and the header user menu. */
export function SignOutModal({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const signOut = useSignOut()

  // signOut always ends the local session, so it does not fail.
  const handleSignOut = () =>
    signOut.mutate(undefined, {
      onSuccess: () => {
        navigate(paths.login)
        message.success('Đã đăng xuất.')
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
    >
      Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng Harmonia.
    </Modal>
  )
}
