/**
 * Route paths for every page in docs/design/stitch-screen-map.md (workspace root).
 * Paths are proposals from phase 0; role prefixes separate the per-role Stitch variants of the same page.
 * Each prefix is admitted only to its role by RoleGuard.
 */
export const paths = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  /** Target of the emailed reset link; the backend's PasswordReset__WebUrl must point here. */
  resetPassword: '/reset-password',
  /** Signed-in users; Admin-created accounts are sent here until they replace the emailed first password. */
  changePassword: '/change-password',
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
    skillApproval: '/director/skill-approval',
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
