import { SearchOutlined } from '@ant-design/icons'
import { Input, Tabs } from 'antd'
import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { PageHeader } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ReportFilterBar } from '../components/ReportFilterBar'
import { ReportPanel } from '../components/ReportPanel'
import { useCatalogOptions } from '../hooks/useCatalogOptions'
import { hasActiveReportFilters } from '../reportFilters'
import { priestReportKinds, reportDefinitions } from '../reportDefinitions'
import type { PriestReportKind, ReportFilters } from '../types'

/** Priest / Liturgy Committee: service history, song usage and event preparation reports (FE-22). */
export function PriestReportsPage() {
  const navigate = useNavigate()
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')
  const [kind, setKind] = useState<PriestReportKind>('serviceHistory')
  const [filters, setFilters] = useState<ReportFilters>({})
  const [search, setSearch] = useState('')

  const clearFilters = () => {
    setFilters({})
    setSearch('')
  }

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
        onChange={(event) => setSearch(event.target.value)}
        style={{ maxWidth: 360, marginBottom: spacing.sm }}
      />
      <ReportFilterBar
        value={filters}
        onChange={setFilters}
        onReset={clearFilters}
        seasons={seasons}
        massTypes={massTypes}
        ceremonyTypes={ceremonyTypes}
      />
      <Tabs
        destroyOnHidden
        activeKey={kind}
        onChange={(key) => setKind(key as PriestReportKind)}
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
