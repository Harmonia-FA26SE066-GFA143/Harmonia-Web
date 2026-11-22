import type { ReactNode } from 'react'

/**
 * Harmonia's own glyphs: the inside of a 24×24 svg with a 1.5 round stroke in `currentColor` (attributes set once in
 * Icon). Named by meaning, so a drawing can change without touching pages.
 */

// A voice part is its letter in a square note.
const note = <rect x="3" y="3" width="18" height="18" rx="2" />
const calendarFrame = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>
const tick = <path d="m8 12.5 2.8 2.8 5.7-5.8" />
const person = <><circle cx="10" cy="8" r="4" /><path d="M3 20a7 7 0 0 1 14 0" /></>
const lens = <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>

const domain = {
  soprano: <>{note}<path d="M15 9.2C14.4 8.2 13.3 7.6 12 7.6c-1.8 0-3 .9-3 2.2 0 3 6.2 1.6 6.2 4.5 0 1.3-1.3 2.2-3.2 2.2-1.4 0-2.6-.6-3.3-1.7" /></>,
  alto: <>{note}<path d="m8 17 4-10 4 10M9.4 13.6h5.2" /></>,
  tenor: <>{note}<path d="M7.8 7.5h8.4M12 7.5V17" /></>,
  bass: <>{note}<path d="M9 12h3.3c1.4 0 2.3-.8 2.3-2.2 0-1.4-1-2.3-2.4-2.3H9V17h3.7c1.7 0 2.8-1 2.8-2.6 0-1.4-1-2.4-2.6-2.4" /></>,
  /** The missal ribbon of a liturgical season. */
  'liturgy-season': <path d="M7 3h10v18l-5-3.6L7 21Z" />,
  /** A leaf of music: a staff and a note. */
  'sheet-music': <><path d="M6 3h9l4 4v14H6Z" /><path d="M15 3v4h4M9 11h7M9 14h7" /><path d="M12.5 17.5v-6" /><circle cx="11" cy="17.5" r="1.5" /></>,
  /** A roll-call sheet: two names, one ticked. */
  attendance: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m7.5 8.5 1.3 1.3 2.4-2.6M14 8.8h3M8 15.2h3M14 15.2h3" /></>,
  /** A song itself: two beamed notes (its printed score is `sheet-music`). */
  song: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  /** Practice handed to singers: a clipboard with a note on it. */
  assignment: <><path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" /><rect x="9" y="2.5" width="6" height="3" rx="1" /><path d="M13 10v5.5M13 10l2.5 1" /><circle cx="11.5" cy="15.5" r="1.5" /></>,
  /** A day on the calendar with a note on it. */
  rehearsal: <>{calendarFrame}<path d="M13 13v4.5l2.5-1" /><circle cx="11.5" cy="17.5" r="1.5" /></>,
  /** The order of a Mass: numbered lines. */
  program: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  choir: <><circle cx="12" cy="7" r="3" /><path d="M6 20v-1a6 6 0 0 1 12 0v1" /><circle cx="5" cy="9" r="2" /><circle cx="19" cy="9" r="2" /><path d="M2 18v-.5A3.5 3.5 0 0 1 5.5 14M22 18v-.5a3.5 3.5 0 0 0-3.5-3.5" /></>,
  'choir-member': <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M5.5 16a3.5 3.5 0 0 1 7 0M14 10h4M14 13h4" /></>,
  'member-add': <>{person}<path d="M19 8v6M16 11h6" /></>,
  participation: <>{person}<path d="m16 11 2 2 4-4" /></>,
  roster: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>,
  /** A rosette: someone put forward. */
  nomination: <><circle cx="12" cy="9" r="5" /><path d="m9 13.2-1.5 7.8 4.5-2.5 4.5 2.5-1.5-7.8" /></>,
  'skill-approval': <><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></>,
  audio: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></>,
  practice: <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" /><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
  lyrics: <path d="M4 6h16M4 10h12M4 14h16M4 18h10" />,
  'liturgy-category': <><path d="M4 19.5v-15A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5Zm0 0A1.5 1.5 0 0 0 5.5 21H19v-3" /><path d="M9 7h6" /></>,
  tag: <><path d="M3 4v7.6a1 1 0 0 0 .3.7l8.4 8.4a1 1 0 0 0 1.4 0l7.6-7.6a1 1 0 0 0 0-1.4l-8.4-8.4a1 1 0 0 0-.7-.3H4a1 1 0 0 0-1 1Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  notes: <><path d="M4 5h16v11H9l-5 4Z" /><path d="M8 9h8M8 12h5" /></>,
  report: <path d="M4 20h16M7 16v-5M12 16V6M17 16V8" />,
  overview: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
  'liturgy-tip': <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />,
  venue: <><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  calendar: calendarFrame,
}

const media = {
  play: <path d="M8 5.5v13L18.5 12Z" />,
  'play-solid': <path d="M8 5.5v13L18.5 12Z" fill="currentColor" />,
  pause: <path d="M9 5v14M15 5v14" />,
  'pause-circle': <><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
  'zoom-in': <>{lens}<path d="M8 11h6M11 8v6" /></>,
  'zoom-out': <>{lens}<path d="M8 11h6" /></>,
  'fit-page': <><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" /><rect x="8" y="8" width="8" height="8" rx="1" /></>,
  fullscreen: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
  'fullscreen-exit': <path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" />,
}

const ui = {
  add: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16Zm9-13 4 4" />,
  delete: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.5M20 4v4.5h-4.5" />,
  search: lens,
  send: <path d="M21 3 10 14M21 3l-6.5 18-4.5-7-7-4.5Z" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  upload: <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />,
  'folder-open': <path d="M3 19V6a1 1 0 0 1 1-1h5l2 2h7a1 1 0 0 1 1 1v2M3 19l2.6-7.3a1 1 0 0 1 .9-.7H21l-2.7 7.3a1 1 0 0 1-.9.7Z" />,
  save: <><path d="M5 4h11l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></>,
  filter: <path d="M4 5h16l-6 7.5V19l-4 1.5v-8Z" />,
  /** An eraser: take the filters off. */
  clear: <path d="m4 15 9-9a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L13 18H7Zm5.5-5.5L15 15m-2 3h7" />,
  export: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  swap: <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  minus: <path d="M5 12h14" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-up': <path d="M12 19V5M6 11l6-6 6 6" />,
  'arrow-down': <path d="M12 5v14M6 13l6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  'check-circle': <><circle cx="12" cy="12" r="9" />{tick}</>,
  'check-square': <><rect x="4" y="4" width="16" height="16" rx="2" />{tick}</>,
  square: <rect x="4" y="4" width="16" height="16" rx="2" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'close-circle': <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  warning: <path d="M12 4 2.8 19.5h18.4ZM12 10v4.5M12 17.2v.3" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  logout: <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l3 3M14.5 8.5 17 11" /></>,
  /** A cloud with a slash: no connection. */
  offline: <path d="M7.5 18H17a4 4 0 0 0 .5-8A6 6 0 0 0 6 10.5 3.75 3.75 0 0 0 7.5 18ZM4 4l16 16" />,
  settings: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  history: <path d="M3.5 12A8.5 8.5 0 1 0 6 6M3 4v4h4M12 8v4.5l3 2" />,
  notification: <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15ZM10 20.5a2 2 0 0 0 4 0" />,
  translate: <path d="M4 5h9M8.5 3v2M6 5c.5 3 3 6 6 7.5M11 5c-.7 3.3-3.3 6.4-6.5 8M13 21l4-9 4 9M14.4 18h5.2" />,
  highlight: <path d="M5 20h6M9 14l7.5-7.5 3 3L12 17H9Z" />,
  account: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  /** Background work of this tab: a checklist. */
  tasks: <path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18h4M11 6.5h9M11 12.5h9M11 18h9" />,
  /** Who may do what: a person with a shield. */
  roles: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 10-5.5M18 12.5 14.5 14v2.5c0 2 1.5 3.6 3.5 4.2 2-.6 3.5-2.2 3.5-4.2V14Z" /></>,
  /** Move to another role workspace: a panel and two opposed arrows. */
  'workspace-switch': <><rect x="3" y="4" width="8" height="16" rx="1.5" /><path d="M14 8h7M18 5l3 3-3 3M21 16h-7M17 13l-3 3 3 3" /></>,
}

export const iconRegistry: Record<keyof typeof domain | keyof typeof media | keyof typeof ui, ReactNode> = { ...domain, ...media, ...ui }

export type IconName = keyof typeof iconRegistry

export const ICON_NAMES = Object.keys(iconRegistry) as readonly IconName[]
