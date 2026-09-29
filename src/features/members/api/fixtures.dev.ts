/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `membersApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fictional members; skill names are the FE-03 examples. The participation and attendance fixtures read
 * `choirMembers` so every page shows the same people.
 */
import { readFixture } from '@/lib/api/fixtureRuntime.dev'
import type { ChoirMember } from '../types'

export const choirMembers: ChoirMember[] = [
  { id: 'dev-member-1', fullName: 'Maria Nguyễn Thu Hướng', skills: ['Organ'] },
  { id: 'dev-member-2', fullName: 'Têrêsa Lê Hoàng Vy', skills: ['Soprano', 'Psalmist'] },
  { id: 'dev-member-3', fullName: 'Giuse Maria Vũ Đình Khôi', skills: ['Tenor'] },
  { id: 'dev-member-4', fullName: 'Gioan B. Phạm Hữu Tài', skills: ['Bass'] },
  { id: 'dev-member-5', fullName: 'Phaolô Hoàng Anh Tuấn', skills: ['Guitar', 'Bass'] },
  { id: 'dev-member-6', fullName: 'Giuse Nguyễn Hoàng Long', skills: ['Tenor'] },
  { id: 'dev-member-7', fullName: 'Têrêsa Trần Kim Chi', skills: ['Alto'] },
  { id: 'dev-member-8', fullName: 'Vinhsơn Nguyễn Văn Hưng', skills: ['Tenor'] },
  { id: 'dev-member-9', fullName: 'Têrêsa Phạm Quỳnh Như', skills: ['Soprano'] },
  { id: 'dev-member-10', fullName: 'Simon Phan Văn Đức', skills: ['Bass'] },
  { id: 'dev-member-11', fullName: 'Anna Đặng Thị Mai', skills: ['Soprano', 'Solo Singing'] },
  { id: 'dev-member-12', fullName: 'Maria Vũ Thị Ngọc', skills: ['Alto'] },
]

export const listChoirMembersFixture = () => readFixture(choirMembers)
