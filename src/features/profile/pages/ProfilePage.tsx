import { App, Button } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { requestFailureMessage } from '@/lib/api/errors'
import { ErrorState, Icon, PageHeader, SectionSkeleton } from '@/shared/ui'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { ProfileDetails } from '../components/ProfileDetails'
import { useMyProfile, useUpdateMyProfile } from '../hooks/useMyProfile'
import type { ProfileUpdateValues } from '../types'

export function ProfilePage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const profile = useMyProfile()
  const update = useUpdateMyProfile()
  const [editing, setEditing] = useState(false)

  const handleSave = (values: ProfileUpdateValues) => {
    if (update.isPending) return
    update.mutate(values, {
      onSuccess: () => {
        message.success('Đã lưu thay đổi.')
        setEditing(false)
      },
      onError: (error) => message.error(requestFailureMessage(error, 'Không thể lưu thay đổi. Vui lòng thử lại.')),
    })
  }

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        extra={
          // Sign-out lives in the account menu of the running head, on every page (owner 2026-11-24: no duplicates).
          <Button icon={<Icon name="key" />} onClick={() => navigate(paths.changePassword)}>
            Đổi mật khẩu
          </Button>
        }
      />

      {profile.isPending && <SectionSkeleton rows={4} label="Đang tải hồ sơ cá nhân" />}
      {profile.isError && (
        <ErrorState
          title="Không thể tải hồ sơ cá nhân"
          error={profile.error} hasData={profile.data !== undefined} onRetry={() => profile.refetch()}
          retrying={profile.isFetching}
        />
      )}
      {profile.data && (
        <div className="hm-profile">
          <ProfileAvatar profile={profile.data} />
          <ProfileDetails
            profile={profile.data}
            editing={editing}
            saving={update.isPending}
            onEdit={() => setEditing(true)}
            onCancel={() => setEditing(false)}
            onSave={handleSave}
          />
        </div>
      )}

    </>
  )
}
