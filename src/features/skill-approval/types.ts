/**
 * A skill a choir member declared in the mobile app, waiting for the Choir Director (FE-25): `MemberSkillDetailDto`
 * of `GET /api/member-skills/pending`. Skills carry no level since BE d497b1d.
 */
export interface PendingSkill {
  id: string
  memberName: string
  skillName: string
  categoryName: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  declaredAt: string
  /** A recording or clip the member attached on mobile (BE 9b1f587); optional for the decision. */
  evidence?: SkillEvidence
}

export interface SkillEvidence {
  kind: 'voice' | 'clip'
  fileName: string
  /** Short-lived signed URL: the list is read again instead of storing it. */
  url: string
}
