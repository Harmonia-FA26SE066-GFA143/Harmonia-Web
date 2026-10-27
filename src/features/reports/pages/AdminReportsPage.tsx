import { DownloadOutlined } from '@ant-design/icons'
import { App, Button, Flex, Tabs } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useChoirs } from '@/features/choirs'
import { useCatalogOptions } from '@/features/system-categories'
import { vietnamToday } from '@/lib/api/dates'
import { PageHeader } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ActivityTrendCard } from '../components/ActivityTrendCard'
import { ExportHistory } from '../components/ExportHistory'
import { ExportReportDrawer } from '../components/ExportReportDrawer'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportPanel } from '../components/ReportPanel'
import { useExportReport } from '../hooks/useReports'
import { adminReportKinds, reportDefinitions } from '../reportDefinitions'
import { reportErrorMessage } from '../reportErrors'
import { hasActiveReportFilters, readReportFilters, writeReportParams } from '../reportFilters'
import { saveFile } from '../saveFile'
import type { AdminReportKind, ReportExportRequest, ReportFilters } from '../types'

/**
 * Admin: the four FE-52 reports and the Priest's two (`/api/reports`), with export to a file (FE-53) and the list of
 * exports. The choir filter narrows the three per-member reports, the chart and their export to the members of one
 * choir; the other reports ignore it (`SearchReportsRequest.ChoirId`).
 */
export function AdminReportsPage() {
  const { message } = App.useApp()
  const seasons = useCatalogOptions('seasons')
  const choirs = useChoirs()
  const choirOptions = (choirs.data ?? []).map((choir) => ({
    value: choir.id,
    label: choir.isActive ? choir.name : `${choir.name} (ngừng hoạt động)`,
  }))
  const exportReport = useExportReport()
  const [params, setParams] = useSearchParams()
  const kind = adminReportKinds.find((item) => item === params.get('kind')) ?? 'userActivity'
  const filters = useMemo(() => readReportFilters(params), [params])
  const show = (nextKind: AdminReportKind, nextFilters: ReportFilters) =>
    setParams(writeReportParams(nextKind, nextFilters), { replace: true })
  const [exporting, setExporting] = useState(false)
  // Twelve months ending with the month chosen in the filters, or the current one.
  const trendEnd = (filters.month ? dayjs(`${filters.month}-01`) : dayjs(vietnamToday())).endOf('month')
  const trendQuery = {
    groupBy: 'month' as const,
    fromDate: trendEnd.subtract(11, 'month').startOf('month').format('YYYY-MM-DD'),
    toDate: trendEnd.format('YYYY-MM-DD'),
    choirId: filters.choirId,
  }

  const handleExport = (request: ReportExportRequest) => {
    if (exportReport.isPending) return
    exportReport.mutate(request, {
      onSuccess: (file) => {
        saveFile(file, `bao-cao-${request.kind}-${dayjs().format('YYYYMMDD-HHmm')}.${request.format}`)
        message.success('Đã xuất báo cáo.')
        setExporting(false)
      },
      onError: (error) => message.error(reportErrorMessage(error, 'Không thể xuất báo cáo. Vui lòng thử lại.')),
    })
  }

  return (
    <>
      <PageHeader
        title="Báo cáo"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Báo cáo' }]}
        description="Theo dõi hoạt động người dùng, điểm danh, xác nhận tham gia, bài tập, lịch sử phục vụ và sử dụng bài hát."
        extra={
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => setExporting(true)}>
            Xuất báo cáo
          </Button>
        }
      />
      <ActivityTrendCard query={trendQuery} title={`Điểm danh và bài tập 12 tháng đến ${trendEnd.format('MM/YYYY')}`} />
      <ReportFilterBar value={filters} onChange={(next) => show(kind, next)} onReset={() => show(kind, {})} seasons={seasons} choirs={choirOptions} />
      <Flex vertical gap={spacing.lg}>
        <Tabs
          destroyOnHidden
          activeKey={kind}
          onChange={(key) => show(key as AdminReportKind, filters)}
          items={adminReportKinds.map((reportKind) => ({
            key: reportKind,
            label: reportDefinitions[reportKind].label,
            children: (
              <ReportPanel
                key={JSON.stringify(filters)}
                kind={reportKind}
                filters={filters}
                filtered={hasActiveReportFilters(filters)}
                onClearFilters={() => show(kind, {})}
              />
            ),
          }))}
        />
        <ExportHistory seasons={seasons} />
      </Flex>
      <ExportReportDrawer
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
