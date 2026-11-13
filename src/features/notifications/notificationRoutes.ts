import { generatePath } from 'react-router'
import { paths } from '@/app/router/paths'
import type { ApiRoleName } from '@/lib/auth/session'
import type { AppNotification } from './types'

type Route = string | ((id: string) => string)

/**
 * The page of each subject a notification can refer to (`NotificationDto.ReferenceType`, the entity name the backend
 * services write), inside the reader's own workspace. A `SongList` reference is the list's id, not its event's, and a
 * submission has no page of its own, so both open the list they are worked from. Subjects of the mobile app
 * (`PracticeAssignment`, `Rehearsal`) and unknown ones have no page: the notification is then only marked read.
 */
const routes: Partial<Record<ApiRoleName, Record<string, Route>>> = {
  ParishPriest: {
    LiturgicalEvent: (id) => generatePath(paths.priest.programDetail, { programId: id }),
    SongList: paths.priest.programs,
    DirectorNote: paths.priest.notes,
    DirectorNomination: paths.priest.nominations,
  },
  ChoirDirector: {
    LiturgicalEvent: (id) => generatePath(paths.director.programDetail, { programId: id }),
    SongList: paths.director.programs,
    PracticeSubmission: paths.director.practice,
    MemberSkill: paths.director.skillApproval,
    Choir: paths.director.choirs,
    DirectorNote: paths.director.notes,
    DirectorNomination: paths.director.nominations,
  },
  Admin: {
    MemberRegistration: paths.admin.memberRegistrations,
    DirectorNomination: paths.admin.nominations,
  },
}

export function notificationPath({ referenceType, referenceId }: AppNotification, roleName?: ApiRoleName): string | undefined {
  const route = roleName && referenceType ? routes[roleName]?.[referenceType] : undefined
  if (typeof route === 'function') return referenceId ? route(referenceId) : undefined
  return route
}
