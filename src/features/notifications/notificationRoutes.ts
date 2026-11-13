import { generatePath } from 'react-router'
import { paths } from '@/app/router/paths'
import type { ApiRoleName } from '@/lib/auth/session'
import { getSongListEventId } from './api/notificationsApi'
import type { AppNotification } from './types'

type Route = string | ((id: string) => string)

/**
 * The page of each subject a notification can refer to (`NotificationDto.ReferenceType`, the entity name the backend
 * services write), inside the reader's own workspace. A submission has no page of its own, so it opens the list it
 * is graded from; a `SongList` is refined by `resolveNotificationPath`. Subjects of the mobile app
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

/** Where a song list is worked on: the Priest reviews it, the Choir Director composes it. */
const songListPages: Partial<Record<ApiRoleName, string>> = {
  ParishPriest: paths.priest.songListReview,
  ChoirDirector: paths.director.songListProposal,
}

/**
 * The page to open, which for a `SongList` needs one read: its reference is the list's id, and the pages go by the
 * event's (`GET api/song-lists/{id}`, Choir Director and Parish Priest). A list that cannot be read (deleted, a
 * draft the Priest may not see) falls back to the program list of `notificationPath`.
 */
export async function resolveNotificationPath(notification: AppNotification, roleName?: ApiRoleName): Promise<string | undefined> {
  const fallback = notificationPath(notification, roleName)
  const page = roleName && songListPages[roleName]
  if (notification.referenceType !== 'SongList' || !notification.referenceId || !page) return fallback
  try {
    return generatePath(page, { programId: await getSongListEventId(notification.referenceId) })
  } catch {
    return fallback
  }
}

export function notificationPath({ referenceType, referenceId }: AppNotification, roleName?: ApiRoleName): string | undefined {
  const route = roleName && referenceType ? routes[roleName]?.[referenceType] : undefined
  if (typeof route === 'function') return referenceId ? route(referenceId) : undefined
  return route
}
