import { Form, TreeSelect, Typography } from 'antd'
import { colors } from '@/styles/tokens'
import { useSaveSongTheme, useSongThemes } from '../hooks/useCatalogs'
import { themePath, themeTreeData, themeWithDescendants } from '../songThemeTree'
import type { SongTheme } from '../types'
import { CatalogManager } from './CatalogManager'
import { descriptionColumn, descriptionField } from './description'

/**
 * The parent of the theme being edited: never itself or one of its sub-themes, and never a switched-off theme unless
 * it is already the parent (LookupService.SaveSongThemeAsync); those stay in the tree, disabled.
 */
function ParentField({ themes }: Readonly<{ themes: SongTheme[] }>) {
  const form = Form.useFormInstance()
  const id: string | undefined = form.getFieldValue('id')
  const currentParent: string | null | undefined = form.getFieldValue('parentId')
  const excluded = id ? themeWithDescendants(themes, id) : new Set<string>()
  const treeData = themeTreeData(
    themes.map((theme) => (theme.isActive ? theme : { ...theme, name: `${theme.name} (ngừng dùng)` })),
    (theme) => excluded.has(theme.id) || (!theme.isActive && theme.id !== currentParent),
  )

  return (
    <Form.Item
      label="Chủ đề cha (không bắt buộc)"
      name="parentId"
      extra="Để trống nếu là chủ đề gốc. Lọc bài theo một chủ đề cũng ra bài của các chủ đề con."
    >
      <TreeSelect allowClear showSearch treeNodeFilterProp="title" treeDefaultExpandAll placeholder="Chủ đề gốc" treeData={treeData} />
    </Form.Item>
  )
}

/** Song themes as a tree (BE d1ca63e): each row shows where it sits; sub-themes follow their parent. */
export function SongThemesPanel() {
  const query = useSongThemes()
  const themes = query.data ?? []

  return (
    <CatalogManager
      noun="chủ đề bài hát"
      query={query}
      save={useSaveSongTheme()}
      columns={[
        {
          key: 'parent',
          title: 'Thuộc chủ đề',
          render: (_, theme: SongTheme) =>
            theme.parentId ? (
              themePath(themes, theme.parentId)
            ) : (
              <Typography.Text style={{ color: colors.textMuted }}>Chủ đề gốc</Typography.Text>
            ),
        },
        descriptionColumn,
      ]}
      fields={
        <>
          <ParentField themes={themes} />
          {descriptionField}
        </>
      }
    />
  )
}
