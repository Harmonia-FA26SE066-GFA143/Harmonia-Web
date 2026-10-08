import { DownloadOutlined } from '@ant-design/icons'
import { App, Button, Tabs } from 'antd'
import { useState } from 'react'
import { PageHeader } from '@/shared/ui'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ExportReportModal } from '../components/ExportReportModal'
import { ReportPanel } from '../components/ReportPanel'
import { useCatalogOptions } from '@/features/system-categories'
import { useExportReport } from '../hooks/useReports'
import { hasActiveReportFilters } from '../reportFilters'
import { adminReportKinds, reportDefinitions } from '../reportDefinitions'
import type { AdminReportKind, ReportExportRequest, ReportFilters } from '../types'

/** Admin: activity, attendance, participation and assignment-completion reports (FE-52) with export (FE-53). */
export function AdminReportsPage() {
  const { message } = App.useApp()
  const seasons = useCatalogOptions('seasons')
  const exportReport = useExportReport()
  const [kind, setKind] = useState<AdminReportKind>('rehearsalAttendance')
  const [filters, setFilters] = useState<ReportFilters>({})
  const [exporting, setExporting] = useState(false)

  const handleExport = (request: ReportExportRequest) =>
    exportReport.mutate(request, {
      onSuccess: () => {
        message.success('Đã gửi yêu cầu xuất báo cáo.')
        setExporting(false)
      },
      onError: () => message.error('Không thể xuất báo cáo. Vui lòng thử lại.'),
    })

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
      <ReportFilterBar value={filters} onChange={setFilters} onReset={() => setFilters({})} showMonth seasons={seasons} />
      <Tabs
        destroyOnHidden
        activeKey={kind}
        onChange={(key) => setKind(key as AdminReportKind)}
        items={adminReportKinds.map((reportKind) => ({
          key: reportKind,
          label: reportDefinitions[reportKind].label,
          children: (
            <ReportPanel
              kind={reportKind}
              filters={filters}
              filtered={hasActiveReportFilters(filters)}
              onClearFilters={() => setFilters({})}
            />
          ),
        }))}
      />
      <ExportReportModal
        open={exporting}
        initialKind={kind}
        seasons={seasons}
        exporting={exportReport.isPending}
        onSubmit={handleExport}
        onCancel={() => setExporting(false)}
      />
    </>
  )
}
