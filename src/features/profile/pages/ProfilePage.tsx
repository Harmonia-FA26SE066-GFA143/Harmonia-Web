import { KeyOutlined, LogoutOutlined } from '@ant-design/icons'
import { App, Button, Flex } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { SignOutModal } from '@/features/auth'
import { ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ProfileDetails } from '../components/ProfileDetails'
import { useMyProfile, useUpdateMyProfile } from '../hooks/useMyProfile'
import type { ProfileUpdateValues } from '../types'

export function ProfilePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const profile = useMyProfile()
  const update = useUpdateMyProfile()
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

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Xem và cập nhật thông tin cá nhân của tài khoản."
        extra={
          <Flex wrap gap={spacing.sm}>
            <Button icon={<KeyOutlined />} onClick={() => navigate(paths.changePassword)}>
              Đổi mật khẩu
            </Button>
            <Button icon={<LogoutOutlined />} onClick={() => setConfirmingSignOut(true)}>
              Đăng xuất
            </Button>
          </Flex>
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

      <SignOutModal open={confirmingSignOut} onClose={() => setConfirmingSignOut(false)} />
    </>
  )
}
