import { ApiError } from '@/lib/api/errors'

/** Refusals of GET /api/reports/* (Harmonia-BE SearchReportsRequestValidator, ReportExportService). */
const messages: Record<string, string> = {
  REPORT_NO_DATA: 'Không có dữ liệu nào để xuất theo phạm vi đã chọn.',
  REPORT_DATE_RANGE_INVALID: 'Khoảng thời gian không hợp lệ.',
  REPORT_DATE_RANGE_TOO_LARGE: 'Khoảng thời gian quá dài. Vui lòng chọn khoảng ngắn hơn.',
  REPORT_TYPE_NOT_SUPPORTED: 'Loại báo cáo này không xuất được.',
}

export function reportErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
