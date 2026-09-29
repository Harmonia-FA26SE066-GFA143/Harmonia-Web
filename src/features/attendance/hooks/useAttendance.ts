import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { getAttendance, saveAttendance } from '../api/attendanceApi'
import type { AttendanceValue } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const attendanceKey = (rehearsalId: string) => ['attendance', rehearsalId] as const

export function useAttendance(rehearsalId?: string) {
  return useQuery({
    queryKey: attendanceKey(rehearsalId ?? ''),
    queryFn: () => getAttendance(rehearsalId ?? ''),
    enabled: Boolean(rehearsalId),
    retry,
  })
}

export function useSaveAttendance(rehearsalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, AttendanceValue>) => saveAttendance(rehearsalId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKey(rehearsalId) }),
  })
}
