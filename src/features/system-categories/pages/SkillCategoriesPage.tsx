import { Select, Tabs, Typography } from 'antd'
import { useUrlTab } from '@/shared/hooks/useUrlTab'
import { EmptyCell, Form, PageHeader, SELECT_POPUP_PROPS } from '@/shared/ui'
import { genderLabel, genderOptions, type Gender } from '@/shared/utils/personName'
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
  const unknownCategory =
    categoryQuery.status === 'success' ? (
      <EmptyCell />
    ) : (
      <Typography.Text style={{ color: colors.textMuted }}>{categoryQuery.status === 'pending' ? 'Đang tải…' : 'Chưa tải được'}</Typography.Text>
    )
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
          render: (categoryId: string) => categoryName.get(categoryId) ?? unknownCategory,
        },
        {
          key: 'gender',
          title: 'Dành cho',
          dataIndex: 'gender',
          render: (gender: Gender | null) => (gender ? genderLabel(gender) : 'Mọi ca viên'),
        },
        descriptionColumn,
      ]}
      fields={
        <>
          <Form.Item label="Nhóm kỹ năng" name="categoryId" rules={[{ required: true, message: 'Vui lòng chọn nhóm kỹ năng.' }]}>
            <Select
              {...SELECT_POPUP_PROPS}
              loading={categoryQuery.isPending}
              notFoundContent={categoryQuery.isError ? 'Không tải được danh sách nhóm kỹ năng.' : undefined}
              placeholder="Chọn nhóm kỹ năng"
              options={categories.map(({ id, name, isActive }) => ({
                value: id,
                label: isActive ? name : `${name} (ngừng dùng)`,
              }))}
            />
          </Form.Item>
          {/* PUT replaces the whole skill, so the gender is always sent back (SaveSkillRequest.Gender, BE 1e2f8f8). */}
          <Form.Item
            label="Dành cho"
            name="gender"
            normalize={(value?: Gender) => value ?? null}
            extra="Chỉ ca viên thuộc giới tính này được khai báo kỹ năng, ví dụ bè Soprano dành cho nữ."
          >
            <Select {...SELECT_POPUP_PROPS} allowClear placeholder="Mọi ca viên" aria-label="Dành cho" options={genderOptions} />
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
        description="Kỹ năng ca viên khai báo và Ca trưởng duyệt, xếp theo nhóm. Mục không dùng nữa được tắt, không xoá."
      />
      <Tabs
        className="khop-seg-tabs"
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
