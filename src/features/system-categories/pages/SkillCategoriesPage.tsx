import { Form, Select, Tabs, Typography } from 'antd'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { PageHeader } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { CatalogManager } from '../components/CatalogManager'
import { descriptionColumn, descriptionField } from '../components/description'
import { useCatalogItems, useSaveCatalogItem, useSaveSkill, useSkills } from '../hooks/useCatalogs'

function SkillsPanel() {
  const query = useSkills()
  const save = useSaveSkill()
  const categoryQuery = useCatalogItems('skillCategories')
  const categories = categoryQuery.data ?? []
  const categoryName = new Map(categories.map((category) => [category.id, category.name]))
  // While the categories load or when they failed, a skill's category is unknown, not absent.
  const unknownCategory = { pending: 'Đang tải…', error: 'Chưa tải được', success: '—' }[categoryQuery.status]
  return (
    <CatalogManager
      noun="kỹ năng"
      query={query}
      save={save}
      columns={[
        {
          key: 'category',
          title: 'Nhóm kỹ năng',
          dataIndex: 'categoryId',
          render: (categoryId: string) =>
            categoryName.get(categoryId) ?? <Typography.Text style={{ color: colors.textMuted }}>{unknownCategory}</Typography.Text>,
        },
        descriptionColumn,
      ]}
      fields={
        <>
          <Form.Item label="Nhóm kỹ năng" name="categoryId" rules={[{ required: true, message: 'Vui lòng chọn nhóm kỹ năng.' }]}>
            <Select
              loading={categoryQuery.isPending}
              notFoundContent={categoryQuery.isError ? 'Không tải được danh sách nhóm kỹ năng.' : undefined}
              placeholder="Chọn nhóm kỹ năng"
              options={categories.map(({ id, name, isActive }) => ({
                value: id,
                label: isActive ? name : `${name} (ngừng dùng)`,
              }))}
            />
          </Form.Item>
          {descriptionField}
        </>
      }
    />
  )
}

function SkillCategoriesPanel() {
  return (
    <CatalogManager
      noun="nhóm kỹ năng"
      query={useCatalogItems('skillCategories')}
      save={useSaveCatalogItem('skillCategories')}
      columns={[descriptionColumn]}
      fields={descriptionField}
    />
  )
}

/**
 * Admin: skill catalog (FE-49). Skills such as Soprano or Organ belong to a skill category such as vocal parts or
 * instruments (Harmonia-BE `SaveSkillRequest.CategoryId`; owner decision 2026-09-30), and both are managed here.
 */
export function SkillCategoriesPage() {
  const [tab, setTab] = useUrlTab(['skills', 'categories'], 'skills')
  return (
    <>
      <PageHeader
        title="Danh mục kỹ năng"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Danh mục kỹ năng' }]}
      />
      <Tabs
        destroyOnHidden
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'skills', label: 'Kỹ năng', children: <SkillsPanel /> },
          { key: 'categories', label: 'Nhóm kỹ năng', children: <SkillCategoriesPanel /> },
        ]}
      />
    </>
  )
}
