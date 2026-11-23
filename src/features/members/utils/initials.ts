/** Initials as the artifact draws them: first and last word, "Maria Nguyễn Thị Lan" → "ML". */
export const initials = (fullName: string) => {
  const words = fullName.trim().split(/\s+/)
  return ((words[0]?.charAt(0) ?? '') + (words.length > 1 ? words.at(-1)!.charAt(0) : '')).toUpperCase()
}
