/** `SkillLevel` of Harmonia-BE, as the member declared it; the wording follows the mobile app. */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export const skillLevelLabels: Record<SkillLevel, string> = {
  beginner: 'Sơ cấp',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
}

/**
 * A skill a choir member declared in the mobile app, waiting for the Choir Director (FE-25): `MemberSkillDetailDto`
 * of `GET /api/member-skills/pending`.
 */
export interface PendingSkill {
  id: string
  memberName: string
  skillName: string
  categoryName: string
  level?: SkillLevel
  /** Backend `DateTime`; read it with `parseUtc`. */
  declaredAt: string
}
