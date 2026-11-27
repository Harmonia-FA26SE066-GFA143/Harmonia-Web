import { roleLabels, type SystemRole } from '@/shared/types/account'
import { UNKNOWN_METRIC_LABEL } from '@/shared/ui'
import { assignableRoles, roleDescriptions } from '../roles'

export interface RoleSummaryProps {
  /** Number of accounts currently holding each role; undefined while loading or unavailable. */
  counts?: Record<SystemRole, number>
  /** Active role filter, when the summary also acts as a quick filter. */
  activeRole?: SystemRole
  onSelectRole?: (role: SystemRole) => void
}

/**
 * The fixed FE-48 roles with their responsibilities, as one sheet split by 1px rules (artifact RolesPage): name, one
 * line of responsibility, the accounts holding it in the display figure. Roles are not created or edited here.
 */
export function RoleSummary({ counts, activeRole, onSelectRole }: Readonly<RoleSummaryProps>) {
  return (
    <ul className="admin-roles">
      {assignableRoles.map((role) => {
        const count = counts?.[role]
        const active = activeRole === role
        return (
          <li key={role} className={[onSelectRole && 'is-interactive', active && 'is-active'].filter(Boolean).join(' ') || undefined}>
            {/* A level 2 heading: the page has no level 2 before this sheet. */}
            <h2>
              {onSelectRole ? (
                <button
                  type="button"
                  className="admin-roles__btn"
                  aria-pressed={active}
                  onClick={() => onSelectRole(role)}
                >
                  {roleLabels[role]}
                </button>
              ) : (
                roleLabels[role]
              )}
            </h2>
            <p>{roleDescriptions[role]}</p>
            <span className="admin-roles__label">Đang gán</span>
            <span className={count === undefined ? 'hm-summary__figure is-unknown' : 'hm-summary__figure'}>
              {count ?? UNKNOWN_METRIC_LABEL}
            </span>
            {count !== undefined && <span className="hm-visually-hidden"> tài khoản</span>}
          </li>
        )
      })}
    </ul>
  )
}
