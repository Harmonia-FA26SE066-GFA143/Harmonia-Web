import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportReport, getReport, listExports, type ReportPage } from '../api/reportsApi'
import type { AdminReportKind, ReportExportRequest, ReportFilters } from '../types'

/** One page of a report; the previous page stays visible while the next one loads. */
export function useReport(kind: AdminReportKind, filters: ReportFilters, page: ReportPage) {
  return useQuery({
    queryKey: ['reports', kind, filters, page],
    queryFn: () => getReport(kind, filters, page),
    placeholderData: keepPreviousData,
  })
}

export function useReportExports(page: ReportPage) {
  return useQuery({
    queryKey: ['reports', 'exports', page],
    queryFn: () => listExports(page),
    placeholderData: keepPreviousData,
  })
}

/** Each export is recorded by the backend, so the list of exports is reloaded. */
export function useExportReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ReportExportRequest) => exportReport(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports', 'exports'] }),
  })
}
