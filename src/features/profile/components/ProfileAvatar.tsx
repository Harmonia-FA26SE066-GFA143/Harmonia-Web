import { DeleteOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Flex, Typography, Upload } from 'antd'
import { errorMessage } from '@/lib/api/errors'
import { colors, radius, spacing } from '@/styles/tokens'
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
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!file.name.includes('.') || !accepted.includes(extension)) return messages.AVATAR_FILE_TYPE_NOT_ALLOWED
  if (file.size > maxBytes) return messages.AVATAR_FILE_TOO_LARGE
  return undefined
}

/** The signed-in user's picture, shown in the header menu too; any role changes or removes their own. */
export function ProfileAvatar({ profile }: Readonly<{ profile: Profile }>) {
  const { message, modal } = App.useApp()
  const update = useUpdateMyAvatar()
  const remove = useDeleteMyAvatar()
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
      autoFocusButton: 'cancel',
      onOk: () =>
        remove
          .mutateAsync()
          .then(() => message.success('Đã xoá ảnh đại diện.'))
          .catch((error: Error) => message.error(errorMessage(error, messages, 'Không thể xoá ảnh đại diện. Vui lòng thử lại.'))),
    })

  return (
    <section
      aria-label="Ảnh đại diện"
      style={{
        padding: spacing.lg,
        marginBottom: spacing.md,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
      }}
    >
      <Flex align="center" gap={spacing.lg} wrap>
        <Avatar size={72} src={profile.avatarUrl} icon={<UserOutlined />} alt="" style={{ background: colors.primary, flexShrink: 0 }} />
        <Flex vertical gap={spacing.xs}>
          <Flex gap={spacing.sm} wrap>
            <Upload
              showUploadList={false}
              accept={accepted.join(',')}
              beforeUpload={(file) => {
                handlePick(file)
                return false
              }}
            >
              <Button icon={<UploadOutlined />} loading={update.isPending} disabled={busy && !update.isPending}>
                {profile.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              </Button>
            </Upload>
            {profile.avatarUrl && (
              <Button icon={<DeleteOutlined />} danger loading={remove.isPending} disabled={busy && !remove.isPending} onClick={handleRemove}>
                Xoá ảnh
              </Button>
            )}
          </Flex>
          <Typography.Text style={{ color: colors.textMuted }}>JPG, PNG hoặc WEBP, tối đa 2 MB.</Typography.Text>
        </Flex>
      </Flex>
    </section>
  )
}
