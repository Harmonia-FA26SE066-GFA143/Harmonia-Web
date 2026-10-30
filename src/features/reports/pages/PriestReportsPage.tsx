import { Tabs } from 'antd'
import { useMemo } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { useCatalogOptions } from '@/features/system-categories'
import { PageHeader } from '@/shared/ui'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportPanel } from '../components/ReportPanel'
import { priestReportKinds, reportDefinitions } from '../reportDefinitions'
import { hasActiveReportFilters, readReportFilters, writeReportParams } from '../reportFilters'
import type { PriestReportKind, ReportFilters } from '../types'

/**
 * Priest / Liturgy Committee: service history and song usage (FE-22, `/api/reports`). The backend has no event
 * preparation report; a published event shows its preparation on its own page.
 */
export function PriestReportsPage() {
  const navigate = useNavigate()
  const seasons = useCatalogOptions('seasons')
  const [params, setParams] = useSearchParams()
  const kind = priestReportKinds.find((item) => item === params.get('kind')) ?? 'serviceHistory'
  const filters = useMemo(() => readReportFilters(params), [params])
  const show = (nextKind: PriestReportKind, nextFilters: ReportFilters) =>
    setParams(writeReportParams(nextKind, nextFilters), { replace: true })
  const clearFilters = () => show(kind, {})

  return (
    <>
      <PageHeader
        title="Báo cáo"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Báo cáo' }]}
      />
      <ReportFilterBar value={filters} onChange={(next) => show(kind, next)} onReset={clearFilters} seasons={seasons} />
      <Tabs
        destroyOnHidden
        activeKey={kind}
        onChange={(key) => show(key as PriestReportKind, filters)}
        items={priestReportKinds.map((reportKind) => ({
          key: reportKind,
          label: reportDefinitions[reportKind].label,
          children: (
            <ReportPanel
              key={JSON.stringify(filters)}
              kind={reportKind}
              filters={filters}
              filtered={hasActiveReportFilters(filters)}
              onClearFilters={clearFilters}
              onOpenProgram={(programId) => navigate(generatePath(paths.priest.programDetail, { programId }))}
            />
          ),
        }))}
      />
    </>
  )
}
