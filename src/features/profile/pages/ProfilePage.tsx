import { LogoutOutlined } from '@ant-design/icons'
import { App, Button, Modal } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useSignOut } from '@/features/auth'
import { ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { ProfileDetails } from '../components/ProfileDetails'
import { useMyProfile, useUpdateMyProfile } from '../hooks/useMyProfile'
import type { ProfileUpdateValues } from '../types'

export function ProfilePage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const profile = useMyProfile()
  const update = useUpdateMyProfile()
  const signOut = useSignOut()
  const [editing, setEditing] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  const handleSave = (values: ProfileUpdateValues) =>
    update.mutate(values, {
      onSuccess: () => {
        message.success('Đã lưu thay đổi.')
        setEditing(false)
      },
      onError: () => message.error('Không thể lưu thay đổi. Vui lòng thử lại.'),
    })

  const handleSignOut = () =>
    signOut.mutate(undefined, {
      onSuccess: () => navigate(paths.login),
      onError: () => {
        setConfirmingSignOut(false)
        message.error('Chưa thể đăng xuất: hệ thống chưa kết nối được máy chủ.')
      },
    })

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Xem và cập nhật thông tin cá nhân của tài khoản."
        extra={
          <Button icon={<LogoutOutlined />} onClick={() => setConfirmingSignOut(true)}>
            Đăng xuất
          </Button>
        }
      />

      {profile.isPending && <SectionSkeleton rows={4} label="Đang tải hồ sơ cá nhân" />}
      {profile.isError && (
        <ErrorState
          title="Không thể tải hồ sơ cá nhân"
          onRetry={() => profile.refetch()}
          retrying={profile.isFetching}
        />
      )}
      {profile.data && (
        <ProfileDetails
          profile={profile.data}
          editing={editing}
          saving={update.isPending}
          onEdit={() => setEditing(true)}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />
      )}

      <Modal
        open={confirmingSignOut}
        title="Đăng xuất khỏi Harmonia?"
        okText="Đăng xuất"
        cancelText="Ở lại"
        confirmLoading={signOut.isPending}
        onOk={handleSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      >
        Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng Harmonia.
      </Modal>
    </>
  )
}
