import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAttendance, saveAttendance } from '../api/attendanceApi'
import type { AttendanceValue } from '../types'

const attendanceKey = (rehearsalId: string) => ['attendance', rehearsalId] as const

export function useAttendance(rehearsalId?: string) {
  return useQuery({
    queryKey: attendanceKey(rehearsalId ?? ''),
    queryFn: () => getAttendance(rehearsalId ?? ''),
    enabled: Boolean(rehearsalId),
  })
}

/** Reloads the sheet after every attempt: a refusal may mean someone else saved it first (ATTENDANCE_ALREADY_RECORDED). */
export function useSaveAttendance(rehearsalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, AttendanceValue>) => saveAttendance(rehearsalId, values),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKey(rehearsalId) })
      // A session with attendance can no longer be deleted (decision 2026-09-30, 6a.7).
      queryClient.invalidateQueries({ queryKey: ['rehearsals'] })
    },
  })
}
