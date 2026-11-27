import { App, Avatar, Button, Flex, Typography } from 'antd'
import { useRef } from 'react'
import { errorMessage } from '@/lib/api/errors'
import { Icon } from '@/shared/ui'
import { fileExtension } from '@/shared/utils/media'
import { personName } from '@/shared/utils/personName'
import { colors, spacing } from '@/styles/tokens'
import { useDeleteMyAvatar, useUpdateMyAvatar } from '../hooks/useMyProfile'
import type { Profile } from '../types'

const accepted = ['.jpg', '.jpeg', '.png', '.webp']
const maxBytes = 2 * 1024 * 1024

/** `PUT /api/auth/me/avatar` refusals (Harmonia-BE docs/error-codes.md). */
const messages: Record<string, string> = {
  AVATAR_FILE_REQUIRED: 'Vui lòng chọn ảnh đại diện.',
  AVATAR_FILE_TYPE_NOT_ALLOWED: 'Ảnh đại diện chỉ nhận JPG, PNG hoặc WEBP.',
  AVATAR_FILE_TOO_LARGE: 'Ảnh đại diện tối đa 2 MB.',
}

/** Checked before sending, with the backend's rules, so a wrong file is refused at once. */
function fileProblem(file: File) {
  const extension = fileExtension(file.name)
  if (!file.name.includes('.') || !accepted.includes(extension)) return messages.AVATAR_FILE_TYPE_NOT_ALLOWED
  if (file.size > maxBytes) return messages.AVATAR_FILE_TOO_LARGE
  return undefined
}

/** The identity card: the signed-in user's picture (shown in the header menu too), name and email; any role changes or removes their own picture. */
export function ProfileAvatar({ profile }: Readonly<{ profile: Profile }>) {
  const { message, modal } = App.useApp()
  const update = useUpdateMyAvatar()
  const remove = useDeleteMyAvatar()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const busy = update.isPending || remove.isPending

  const handlePick = (file: File) => {
    const problem = fileProblem(file)
    if (problem) message.error(problem)
    else
      update.mutate(file, {
        onSuccess: () => message.success('Đã đổi ảnh đại diện.'),
        onError: (error) => message.error(errorMessage(error, messages, 'Không thể đổi ảnh đại diện. Vui lòng thử lại.')),
      })
  }

  const handleRemove = () =>
    modal.confirm({
      title: 'Xoá ảnh đại diện?',
      content: 'Ảnh sẽ bị xoá khỏi hồ sơ; bạn có thể tải ảnh khác bất cứ lúc nào.',
      okText: 'Xoá ảnh',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      focusable: { autoFocusButton: 'cancel' },
      onOk: () =>
        remove
          .mutateAsync()
          .then(() => message.success('Đã xoá ảnh đại diện.'))
          .catch((error: Error) => message.error(errorMessage(error, messages, 'Không thể xoá ảnh đại diện. Vui lòng thử lại.'))),
    })

  const name = personName(profile.fullName, profile.saintName)

  return (
    <aside aria-label="Hồ sơ nhận diện" className="hm-profile-id">
      <Avatar size={96} src={profile.avatarUrl} icon={<Icon name="account" />} alt="" style={{ background: colors.primary, flexShrink: 0 }} />
      {name && <p className="hm-profile-id__name">{name}</p>}
      <p className="hm-profile-id__mail">{profile.email}</p>
      <Flex gap={spacing.sm} wrap justify="center" className="hm-profile-id__actions">
        <input
          ref={fileInputRef}
          type="file"
          accept={accepted.join(',')}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) handlePick(file)
          }}
        />
        <Button
          icon={<Icon name="upload" />}
          loading={update.isPending}
          disabled={busy && !update.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {profile.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </Button>
        {profile.avatarUrl && (
          <Button icon={<Icon name="delete" />} danger loading={remove.isPending} disabled={busy && !remove.isPending} onClick={handleRemove}>
            Xoá ảnh
          </Button>
        )}
      </Flex>
      <Typography.Text className="hm-profile-id__hint">JPG, PNG hoặc WEBP, tối đa 2 MB.</Typography.Text>
    </aside>
  )
}
