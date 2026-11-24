import { voiceParts, type VoicePartLabel } from '../voiceParts'
import { Icon } from './Icon'
import type { IconName } from './registry'

const iconByPart: Record<VoicePartLabel, IconName> = { Soprano: 'soprano', Alto: 'alto', Tenor: 'tenor', Bass: 'bass' }

/** The icon of a voice part named in words; nothing for an instrument or any other skill. */
export function VoicePartIcon({ name }: Readonly<{ name: string }>) {
  const normalized = name.normalize('NFC')
  const match = voiceParts.find(({ pattern }) => pattern.test(normalized))
  return match ? <Icon name={iconByPart[match.label]} /> : null
}
