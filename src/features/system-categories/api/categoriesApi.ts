import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { CatalogItem, CatalogItemValues, LiturgicalCatalog } from '../types'

// Reads exist, not wired yet: `GET /api/lookups/skill-categories`, `skills?categoryId=`,
// `liturgical-seasons`, `mass-types`, `ceremony-types`, `event-categories` (active rows only, any signed-in role).
// TBD: Backend API missing – creating and editing catalog entries for the Admin (tbd-backlog B11).
// Each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped from dist/.

export async function listSkillCategories(): Promise<CatalogItem[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listSkillCategoriesFixture } = await import('./fixtures.dev')
    return listSkillCategoriesFixture()
  }
  throw new ApiContractMissingError('Xem danh mục kỹ năng')
}

export async function createSkillCategory(values: CatalogItemValues): Promise<CatalogItem> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveSkillCategoryFixture } = await import('./fixtures.dev')
    return saveSkillCategoryFixture(undefined, values)
  }
  throw new ApiContractMissingError('Thêm kỹ năng vào danh mục')
}

export async function updateSkillCategory(id: string, values: CatalogItemValues): Promise<CatalogItem> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveSkillCategoryFixture } = await import('./fixtures.dev')
    return saveSkillCategoryFixture(id, values)
  }
  throw new ApiContractMissingError('Chỉnh sửa kỹ năng trong danh mục')
}

export async function listLiturgicalCategories(catalog: LiturgicalCatalog): Promise<CatalogItem[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listLiturgicalCategoriesFixture } = await import('./fixtures.dev')
    return listLiturgicalCategoriesFixture(catalog)
  }
  throw new ApiContractMissingError('Xem danh mục phụng vụ')
}

export async function createLiturgicalCategory(
  catalog: LiturgicalCatalog,
  values: CatalogItemValues,
): Promise<CatalogItem> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveLiturgicalCategoryFixture } = await import('./fixtures.dev')
    return saveLiturgicalCategoryFixture(catalog, undefined, values)
  }
  throw new ApiContractMissingError('Thêm mục vào danh mục phụng vụ')
}

export async function updateLiturgicalCategory(
  catalog: LiturgicalCatalog,
  id: string,
  values: CatalogItemValues,
): Promise<CatalogItem> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveLiturgicalCategoryFixture } = await import('./fixtures.dev')
    return saveLiturgicalCategoryFixture(catalog, id, values)
  }
  throw new ApiContractMissingError('Chỉnh sửa mục trong danh mục phụng vụ')
}
