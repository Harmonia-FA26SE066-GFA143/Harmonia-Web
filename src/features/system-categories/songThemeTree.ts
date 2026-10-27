/** A song theme as the lookups and the Admin list return it: enough to place it in the tree. */
interface ThemeLike {
  id: string
  name: string
  parentId?: string | null
}

/** A node of an Ant Design `TreeSelect`. */
export interface ThemeTreeNode {
  value: string
  title: string
  disabled?: boolean
  children?: ThemeTreeNode[]
}

/**
 * The themes as a tree for a `TreeSelect`, by name at each level. A theme whose parent is not in the list (a parent
 * switched off, which the active lookup leaves out) sits at the top, so it can still be chosen.
 */
export function themeTreeData<T extends ThemeLike>(themes: T[], disabled?: (theme: T) => boolean): ThemeTreeNode[] {
  const ids = new Set(themes.map((theme) => theme.id))
  const build = (parentId: string | null): ThemeTreeNode[] =>
    themes
      .filter((theme) => (theme.parentId && ids.has(theme.parentId) ? theme.parentId : null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      .map((theme) => {
        const children = build(theme.id)
        return {
          value: theme.id,
          title: theme.name,
          ...(disabled?.(theme) && { disabled: true }),
          ...(children.length > 0 && { children }),
        }
      })
  return build(null)
}

/** "Kính Chúa › Thánh Thể": the names from the top theme down to `id`. The backend refuses cycles. */
export function themePath(themes: ThemeLike[], id: string): string {
  const byId = new Map(themes.map((theme) => [theme.id, theme]))
  const names: string[] = []
  for (let theme = byId.get(id); theme; theme = theme.parentId ? byId.get(theme.parentId) : undefined) names.unshift(theme.name)
  return names.join(' › ')
}

/** `id` and every theme under it: a theme cannot move under itself or one of its descendants. */
export function themeWithDescendants(themes: ThemeLike[], id: string): Set<string> {
  const found = new Set([id])
  for (let added = true; added; ) {
    added = false
    for (const theme of themes) {
      if (theme.parentId && found.has(theme.parentId) && !found.has(theme.id)) {
        found.add(theme.id)
        added = true
      }
    }
  }
  return found
}
