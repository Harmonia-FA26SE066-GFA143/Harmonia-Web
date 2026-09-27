import { PageHeader } from '@/shared/ui'
import { CatalogManager } from '../components/CatalogManager'
import { useSaveSkillCategory, useSkillCategories } from '../hooks/useCatalogs'

/**
 * Admin: skill catalog (FE-49). Each entry is an individual skill such as Soprano or Organ
 * (owner decision 2026-09-27), not a skill group.
 */
export function SkillCategoriesPage() {
  const query = useSkillCategories()
  const save = useSaveSkillCategory()

  return (
    <>
      <PageHeader
        title="Danh mục kỹ năng"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Danh mục kỹ năng' }]}
        description="Cấu hình danh mục kỹ năng như bè giọng, nhạc cụ, đơn ca, xướng Thánh vịnh và hỗ trợ điều khiển."
      />
      <CatalogManager
        query={query}
        save={save}
        modalTitles={{ create: 'Thêm kỹ năng', edit: 'Chỉnh sửa kỹ năng' }}
        labels={{
          noun: 'kỹ năng',
          nameColumn: 'Tên kỹ năng',
          addLabel: 'Thêm kỹ năng',
          emptyTitle: 'Chưa có kỹ năng nào',
          emptyDescription: 'Thêm mục đầu tiên cho danh mục kỹ năng.',
          errorTitle: 'Không thể tải danh mục kỹ năng',
        }}
      />
    </>
  )
}
