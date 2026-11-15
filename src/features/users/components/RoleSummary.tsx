import { roleLabels, type SystemRole } from '@/shared/types/account'
import { assignableRoles, roleDescriptions } from '../roles'

export interface RoleSummaryProps {
  /** Number of accounts currently holding each role; undefined while loading or unavailable. */
  counts?: Record<SystemRole, number>
}

/**
 * The fixed FE-48 roles with their responsibilities, as one sheet split by 1px rules (artifact RolesPage): name, one
 * line of responsibility, the accounts holding it in the serif figure. Roles are not created or edited here.
 */
export function RoleSummary({ counts }: Readonly<RoleSummaryProps>) {
  return (
    <ul className="admin-roles">
      {assignableRoles.map((role) => (
        <li key={role}>
          {/* A level 2 heading: the page has no level 2 before this sheet. */}
          <h2>{roleLabels[role]}</h2>
          <p>{roleDescriptions[role]}</p>
          <span className="admin-roles__label">Đang gán</span>
          <span className="hm-summary__figure">{counts?.[role] ?? '–'}</span>
          <span className="hm-visually-hidden"> tài khoản</span>
        </li>
      ))}
    </ul>
  )
}
