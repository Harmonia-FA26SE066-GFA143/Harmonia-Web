import { Typography } from 'antd'
import { colors } from '@/styles/tokens'
import { MISSING_FIELD_LABEL, MISSING_FILE_LABEL, UNASSIGNED_VOICE_LABEL } from './glossary'

/** Canonical muted placeholder for missing profile/contact/text fields (never bare "—", G2-11). */
export function EmptyCell({ text = MISSING_FIELD_LABEL }: Readonly<{ text?: string }>) {
  return <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>
}

/** Canonical muted placeholder for missing uploaded files/attachments. */
export function MissingFileCell({ text = MISSING_FILE_LABEL }: Readonly<{ text?: string }>) {
  return <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>
}

/** Canonical muted label when a member has no approved voice-part skill (R2.6, G2-03). */
export function UnassignedVoiceCell({ text = UNASSIGNED_VOICE_LABEL }: Readonly<{ text?: string }>) {
  return <Typography.Text style={{ color: colors.textMuted }}>{text}</Typography.Text>
}
