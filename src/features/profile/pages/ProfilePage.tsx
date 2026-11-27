import { App, Button, Skeleton } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { requestFailureMessage } from '@/lib/api/errors'
import { ErrorState, Icon, PageHeader } from '@/shared/ui'
import { colors, radius, spacing } from '@/styles/tokens'
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

      {profile.isPending && (
        <output aria-busy="true" aria-label="Đang tải hồ sơ cá nhân" className="hm-profile hm-skeleton-in" style={{ display: 'grid' }}>
          <div className="hm-profile-id">
            <Skeleton.Avatar active size={96} />
            <Skeleton active title={{ width: 160 }} paragraph={{ rows: 2 }} style={{ marginTop: spacing.md, width: '100%' }} />
          </div>
          <div style={{ padding: spacing.lg, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg }}>
            <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 6 }} />
          </div>
        </output>
      )}
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
