import { usePreparationProgress } from '@/features/practice'
import { useRehearsalCount } from '@/features/rehearsals'
import { useRoster, useShortages } from '@/features/roster'
import type { PreparationStatus } from '../types'

/**
 * The Choir Director's view of how ready the choir is for an event (#246). `GET .../preparation-status` is for the Parish
 * Priest only (Harmonia-BE d1ca63e, LiturgicalEventsController.cs:78-79), so the same counts are summed here from what
 * the Choir Director may read: the per-member `preparation-progress` (the rows the BE sums for that status too,
 * EventPreparationService.cs:56-60), the event's rehearsals, and its roster and shortages.
 */
export function useDirectorPreparation(programId: string) {
  const progress = usePreparationProgress(programId)
  const rehearsals = useRehearsalCount(programId)
  const roster = useRoster(programId)
  const shortages = useShortages(programId)
  const queries = [progress, rehearsals, roster, shortages]

  let data: PreparationStatus | undefined
  if (progress.data && rehearsals.data !== undefined && roster.data !== undefined && shortages.data) {
    const rows = progress.data
    const count = (status: string) => rows.filter((row) => row.participationStatus === status).length
    const sum = (pick: (row: (typeof rows)[number]) => number) => rows.reduce((total, row) => total + pick(row), 0)
    // Every row counts the same started rehearsals of the event.
    const rehearsalsHeld = rows[0]?.rehearsalsHeld ?? 0
    data = {
      participation: { invited: count('invited'), confirmed: count('confirmed'), declined: count('declined'), unsure: count('unsure') },
      rosterFinalized: roster.data ? roster.data.status === 'finalized' : undefined,
      // The roster endpoint returns active lines only.
      rosterActiveAssignments: roster.data?.assignments.length ?? 0,
      rosterShortages: shortages.data.map(({ songTitle, skillName, requiredCount, assignedCount }) => ({
        songTitle: songTitle ?? undefined,
        skillName,
        requiredCount,
        assignedCount,
      })),
      rehearsalsTotal: rehearsals.data,
      rehearsalsHeld,
      attendanceExpected: rehearsalsHeld * rows.length,
      attendancePresent: sum((row) => row.rehearsalsAttended),
      practiceExpected: sum((row) => row.assignmentsTotal),
      practicePassed: sum((row) => row.assignmentsPassed),
      practiceOverdue: sum((row) => row.assignmentsOverdue),
    }
  }

  const failed = queries.find((query) => query.isError)
  return {
    data,
    isPending: !failed && data === undefined,
    isError: Boolean(failed),
    error: failed?.error ?? null,
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => queries.forEach((query) => query.refetch()),
  }
}
