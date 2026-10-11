import { DownloadOutlined } from '@ant-design/icons'
import { App, Button, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/shared/ui'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ExportReportModal } from '../components/ExportReportModal'
import { ReportPanel } from '../components/ReportPanel'
import { useCatalogOptions } from '@/features/system-categories'
import { useExportReport } from '../hooks/useReports'
import { hasActiveReportFilters, readReportFilters, writeReportParams } from '../reportFilters'
import { adminReportKinds, reportDefinitions } from '../reportDefinitions'
import type { AdminReportKind, ReportExportRequest, ReportFilters } from '../types'

/** Admin: activity, attendance, participation and assignment-completion reports (FE-52) with export (FE-53). */
export function AdminReportsPage() {
  const { message } = App.useApp()
  const seasons = useCatalogOptions('seasons')
  const exportReport = useExportReport()
  const [params, setParams] = useSearchParams()
  const kind = adminReportKinds.find((item) => item === params.get('kind')) ?? 'rehearsalAttendance'
  const filters = useMemo(() => readReportFilters(params), [params])
  const show = (nextKind: AdminReportKind, nextFilters: ReportFilters) =>
    setParams(writeReportParams(nextKind, nextFilters), { replace: true })
  const [exporting, setExporting] = useState(false)

  const handleExport = (request: ReportExportRequest) => {
    if (exportReport.isPending) return
    exportReport.mutate(request, {
      onSuccess: () => {
        message.success('Đã gửi yêu cầu xuất báo cáo.')
        setExporting(false)
      },
      onError: () => message.error('Không thể xuất báo cáo. Vui lòng thử lại.'),
    })
  }

  return (
    <>
      <PageHeader
        title="Báo cáo"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Báo cáo' }]}
        description="Theo dõi hoạt động, điểm danh, xác nhận tham gia và hoàn thành bài tập."
        extra={
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => setExporting(true)}>
            Xuất báo cáo
          </Button>
        }
      />
      <ReportFilterBar value={filters} onChange={(next) => show(kind, next)} onReset={() => show(kind, {})} showMonth seasons={seasons} />
      <Tabs
        destroyOnHidden
        activeKey={kind}
        onChange={(key) => show(key as AdminReportKind, filters)}
        items={adminReportKinds.map((reportKind) => ({
          key: reportKind,
          label: reportDefinitions[reportKind].label,
          children: (
            <ReportPanel
              kind={reportKind}
              filters={filters}
              filtered={hasActiveReportFilters(filters)}
              onClearFilters={() => show(kind, {})}
            />
          ),
        }))}
      />
      <ExportReportModal
        open={exporting}
        initialKind={kind}
        filters={filters}
        seasons={seasons}
        exporting={exportReport.isPending}
        onSubmit={handleExport}
        onCancel={() => setExporting(false)}
      />
    </>
  )
}
