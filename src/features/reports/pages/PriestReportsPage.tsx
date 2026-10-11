import { SearchOutlined } from '@ant-design/icons'
import { Input, Tabs } from 'antd'
import { useMemo } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { PageHeader } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportPanel } from '../components/ReportPanel'
import { useCatalogOptions } from '@/features/system-categories'
import { hasActiveReportFilters, readReportFilters, writeReportParams } from '../reportFilters'
import { priestReportKinds, reportDefinitions } from '../reportDefinitions'
import type { PriestReportKind, ReportFilters } from '../types'

/** Priest / Liturgy Committee: service history, song usage and event preparation reports (FE-22). */
export function PriestReportsPage() {
  const navigate = useNavigate()
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')
  const [params, setParams] = useSearchParams()
  const kind = priestReportKinds.find((item) => item === params.get('kind')) ?? 'serviceHistory'
  const filters = useMemo(() => readReportFilters(params), [params])
  const search = params.get('search') ?? ''
  // `replace`: typing in the search box must not fill the history; Back leaves the page instead.
  const show = (nextKind: PriestReportKind, nextFilters: ReportFilters, nextSearch: string) =>
    setParams(writeReportParams(nextKind, nextFilters, nextSearch), { replace: true })
  const clearFilters = () => show(kind, {}, '')

  return (
    <>
      <PageHeader
        title="Báo cáo"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Báo cáo' }]}
        description="Theo dõi lịch sử phục vụ, sử dụng bài hát và tình trạng chuẩn bị của ca đoàn."
      />
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm chương trình, bài hát…"
        aria-label="Tìm trong báo cáo"
        value={search}
        onChange={(event) => show(kind, filters, event.target.value)}
        style={{ maxWidth: 360, marginBottom: spacing.sm }}
      />
      <ReportFilterBar
        value={filters}
        onChange={(next) => show(kind, next, search)}
        onReset={clearFilters}
        seasons={seasons}
        massTypes={massTypes}
        ceremonyTypes={ceremonyTypes}
      />
      <Tabs
        destroyOnHidden
        activeKey={kind}
        onChange={(key) => show(key as PriestReportKind, filters, search)}
        items={priestReportKinds.map((reportKind) => ({
          key: reportKind,
          label: reportDefinitions[reportKind].label,
          children: (
            <ReportPanel
              kind={reportKind}
              filters={filters}
              search={search}
              filtered={hasActiveReportFilters(filters) || Boolean(search.trim())}
              onClearFilters={clearFilters}
              onOpenProgram={(programId) => navigate(generatePath(paths.priest.programDetail, { programId }))}
            />
          ),
        }))}
      />
    </>
  )
}
