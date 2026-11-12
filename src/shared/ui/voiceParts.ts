/**
 * The four voice parts, read from approved skill names (Vietnamese or Latin), as VoicePartIcon reads them. The backend
 * has no voice-part field: a member counts in a part when one of their approved skills names it.
 */
export const voiceParts = [
  { label: 'Soprano', pattern: /soprano|nữ cao/i },
  { label: 'Alto', pattern: /alto|nữ trầm/i },
  { label: 'Tenor', pattern: /tenor|nam cao/i },
  { label: 'Bass', pattern: /bass|nam trầm/i },
] as const

export const inVoicePart = (skills: readonly string[], pattern: RegExp) => skills.some((skill) => pattern.test(skill))
