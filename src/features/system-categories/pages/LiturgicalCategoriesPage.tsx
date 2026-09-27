import { Tabs } from 'antd'
import { PageHeader } from '@/shared/ui'
import type { CatalogLabels } from '../components/CatalogTable'
import { CatalogManager } from '../components/CatalogManager'
import { useLiturgicalCategories, useSaveLiturgicalCategory } from '../hooks/useCatalogs'
import type { LiturgicalCatalog } from '../types'

interface CatalogCopy {
  tab: string
  labels: CatalogLabels
  modalTitles: { create: string; edit: string }
}

function copyFor(tab: string, noun: string): CatalogCopy {
  return {
    tab,
    labels: {
      noun,
      nameColumn: `Tên ${noun}`,
      addLabel: `Thêm ${noun}`,
      emptyTitle: `Chưa có ${noun} nào`,
      emptyDescription: `Thêm mục đầu tiên cho danh mục ${noun}.`,
      errorTitle: `Không thể tải danh mục ${noun}`,
    },
    modalTitles: { create: `Thêm ${noun}`, edit: `Chỉnh sửa ${noun}` },
  }
}

/** The four catalogs Report 1 FE-50 lists, in its order. */
const catalogs: Record<LiturgicalCatalog, CatalogCopy> = {
  seasons: copyFor('Mùa phụng vụ', 'mùa phụng vụ'),
  massTypes: copyFor('Loại Thánh lễ', 'loại Thánh lễ'),
  ceremonyTypes: copyFor('Loại nghi thức', 'loại nghi thức'),
  eventCategories: copyFor('Danh mục sự kiện', 'danh mục sự kiện'),
}

function LiturgicalCatalogPanel({ catalog }: { catalog: LiturgicalCatalog }) {
  const query = useLiturgicalCategories(catalog)
  const save = useSaveLiturgicalCategory(catalog)
  const { labels, modalTitles } = catalogs[catalog]
  return <CatalogManager query={query} save={save} labels={labels} modalTitles={modalTitles} />
}

/** Admin: liturgical seasons, Mass types, ceremony types and event categories (FE-50). */
export function LiturgicalCategoriesPage() {
  return (
    <>
      <PageHeader
        title="Danh mục phụng vụ"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Danh mục phụng vụ' }]}
        description="Cấu hình mùa phụng vụ, loại Thánh lễ, loại nghi thức và danh mục sự kiện."
      />
      <Tabs
        destroyOnHidden
        items={(Object.keys(catalogs) as LiturgicalCatalog[]).map((catalog) => ({
          key: catalog,
          label: catalogs[catalog].tab,
          children: <LiturgicalCatalogPanel catalog={catalog} />,
        }))}
      />
    </>
  )
}
