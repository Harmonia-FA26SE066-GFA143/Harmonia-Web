import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAttendance, saveAttendance } from '../api/attendanceApi'
import type { AttendanceRecord, AttendanceValue } from '../types'

const attendanceKey = (rehearsalId: string) => ['attendance', rehearsalId] as const

export function useAttendance(rehearsalId?: string) {
  return useQuery({
    queryKey: attendanceKey(rehearsalId ?? ''),
    queryFn: () => getAttendance(rehearsalId ?? ''),
    enabled: Boolean(rehearsalId),
  })
}

/** Reloads the sheet after every attempt: a refusal may mean someone else saved it first (REHEARSAL_ATTENDANCE_ALREADY_RECORDED). */
export function useSaveAttendance(rehearsalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, AttendanceValue>) => saveAttendance(rehearsalId, values),
    // The saved marks show at once; the reload below then confirms them.
    onSuccess: (_, values) =>
      queryClient.setQueryData<AttendanceRecord[]>(attendanceKey(rehearsalId), (records) =>
        records?.map((record) => (values[record.memberId] ? { ...record, value: values[record.memberId] } : record)),
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKey(rehearsalId) })
      // A session with attendance can no longer be deleted (decision 2026-09-30, 6a.7).
      queryClient.invalidateQueries({ queryKey: ['rehearsals'] })
    },
  })
}
