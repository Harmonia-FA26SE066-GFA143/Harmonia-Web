/**
 * The four voice parts, read from approved skill names (Vietnamese or Latin), as VoicePartIcon reads them. The backend
 * has no voice-part field: a member counts in a part when one of their approved skills names it.
 */
export const voiceParts = [
  { label: 'Soprano', pattern: /(?<![\p{L}\p{N}])(?:soprano|nữ cao)(?![\p{L}\p{N}])/iu },
  { label: 'Alto', pattern: /(?<![\p{L}\p{N}])(?:alto|nữ trầm)(?![\p{L}\p{N}])/iu },
  { label: 'Tenor', pattern: /(?<![\p{L}\p{N}])(?:tenor|nam cao)(?![\p{L}\p{N}])/iu },
  { label: 'Bass', pattern: /(?<!(?:double|electric|acoustic|upright) )(?<![\p{L}\p{N}])(?:bass(?! (?:guitar|drum))|nam trầm)(?![\p{L}\p{N}])/iu },
] as const

export type VoicePartLabel = (typeof voiceParts)[number]['label']

export const inVoicePart = (skills: readonly string[], pattern: RegExp) =>
  skills.some((skill) => pattern.test(skill.normalize('NFC').replace(/\s+/g, ' ')))

/** Returns true when the member holds at least one approved voice-part skill. */
export const hasVoicePart = (skills: readonly string[]) => voiceParts.some((part) => inVoicePart(skills, part.pattern))

export interface VoicePartDistribution {
  Soprano: number
  Alto: number
  Tenor: number
  Bass: number
  /** Count of items with no approved voice-part skill (`Chưa phân bè`, R2.6). */
  unassigned: number
  total: number
}

/**
 * Computes real voice-part counts + explicit `unassigned` (`Chưa phân bè`) count over the full dataset (R2.6, G2-03).
 * Note: a member with multiple approved voice-part skills is counted in each matching part, while `unassigned` counts
 * members matching zero voice parts.
 */
export function countVoiceParts<T>(items: readonly T[], getSkills: (item: T) => readonly string[]): VoicePartDistribution {
  const counts: VoicePartDistribution = {
    Soprano: 0,
    Alto: 0,
    Tenor: 0,
    Bass: 0,
    unassigned: 0,
    total: items.length,
  }

  for (const item of items) {
    const skills = getSkills(item)
    let matchedAny = false
    for (const part of voiceParts) {
      if (inVoicePart(skills, part.pattern)) {
        counts[part.label] += 1
        matchedAny = true
      }
    }
    if (!matchedAny) counts.unassigned += 1
  }

  return counts
}
