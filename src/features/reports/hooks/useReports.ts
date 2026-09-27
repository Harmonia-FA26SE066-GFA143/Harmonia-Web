import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { exportReport, getReport } from '../api/reportsApi'
import type { ReportExportRequest, ReportFilters, ReportKind } from '../types'

export function useReport(kind: ReportKind, filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', kind, filters],
    queryFn: () => getReport(kind, filters),
    // Retrying cannot help while the API contract is missing.
    retry: (failureCount, error) => !(error instanceof ApiContractMissingError) && failureCount < 3,
  })
}

export function useExportReport() {
  return useMutation({ mutationFn: (request: ReportExportRequest) => exportReport(request) })
}
