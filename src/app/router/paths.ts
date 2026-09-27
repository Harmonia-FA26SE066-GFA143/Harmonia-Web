/**
 * Route paths for every page in docs/design/stitch-screen-map.md (workspace root).
 * Paths are proposals from phase 0; role prefixes separate the per-role Stitch variants of the same page.
 * Role-based access control is TBD until the auth contract is available.
 */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  /** Signed-in account whose role an Admin has not confirmed yet (no Stitch screen). */
  pendingConfirmation: '/pending-confirmation',
  profile: '/profile',

  admin: {
    dashboard: '/admin',
    accounts: '/admin/accounts',
    roles: '/admin/roles',
    skillCategories: '/admin/skill-categories',
    liturgicalCategories: '/admin/liturgical-categories',
    settings: '/admin/settings',
    reports: '/admin/reports',
    activityLog: '/admin/activity-log',
  },

  priest: {
    dashboard: '/priest',
    calendar: '/priest/calendar',
    programs: '/priest/programs',
    programCreate: '/priest/programs/new',
    programDetail: '/priest/programs/:programId',
    songListReview: '/priest/programs/:programId/song-review',
    reports: '/priest/reports',
  },

  director: {
    dashboard: '/director',
    programs: '/director/programs',
    programDetail: '/director/programs/:programId',
    songListProposal: '/director/programs/:programId/song-list',
    library: '/director/library',
    songDetail: '/director/library/:songId',
    rehearsals: '/director/rehearsals',
    attendance: '/director/attendance',
    participation: '/director/participation',
    roster: '/director/roster',
    practice: '/director/practice',
    reports: '/director/reports',
  },
} as const
