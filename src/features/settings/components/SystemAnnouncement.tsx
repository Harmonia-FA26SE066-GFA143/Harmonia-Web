import { Alert } from 'antd'
import { spacing } from '@/styles/tokens'
import { usePublicSettings } from '../hooks/useSettings'

/** The Admin's notice to every user (setting `System.Announcement`); nothing while it is empty or cannot be read. */
export function SystemAnnouncement() {
  const announcement = usePublicSettings().data?.announcement
  if (!announcement) return null
  return <Alert type="info" showIcon title={announcement} style={{ marginBottom: spacing.lg, whiteSpace: 'pre-line' }} />
}
