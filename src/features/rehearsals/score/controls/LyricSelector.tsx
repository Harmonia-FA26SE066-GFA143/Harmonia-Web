import { Flex, Select } from 'antd'
import type { ReactNode } from 'react'
import { colors, spacing, typography } from '@/styles/tokens'
import type { LyricPart, LyricSelection } from './useLyricSelection'

function Field({ id, label, children }: Readonly<{ id: string; label: string; children: ReactNode }>) {
  return (
    <Flex align="center" gap={spacing.sm}>
      <label htmlFor={id} style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
        {label}
      </label>
      {children}
    </Flex>
  )
}

/**
 * Which lyric lights while the song plays: the part (shown when more than one part has lyrics) and the verse (shown when
 * that part has more than one). Nothing to choose renders nothing. The visible label is the accessible name.
 */
export function LyricSelector({
  parts,
  verses,
  selection,
  onPart,
  onVerse,
}: Readonly<{
  parts: readonly LyricPart[]
  verses: readonly string[]
  selection: LyricSelection | undefined
  onPart: (partKey: string) => void
  onVerse: (verse: string) => void
}>) {
  if (!selection || (parts.length < 2 && verses.length < 2)) return null
  return (
    <Flex wrap align="center" gap={spacing.lg} style={{ marginTop: spacing.md }}>
      {parts.length > 1 && (
        <Field id="hm-lyric-part" label="Lời của bè">
          <Select
            id="hm-lyric-part"
            value={selection.partKey}
            onChange={onPart}
            options={parts.map((part) => ({ value: part.partKey, label: part.label }))}
            style={{ minWidth: 160 }}
          />
        </Field>
      )}
      {verses.length > 1 && (
        <Field id="hm-lyric-verse" label="Khổ lời">
          <Select
            id="hm-lyric-verse"
            value={selection.verse}
            onChange={onVerse}
            options={verses.map((verse) => ({ value: verse, label: `Khổ ${verse}` }))}
            style={{ minWidth: 120 }}
          />
        </Field>
      )}
    </Flex>
  )
}
