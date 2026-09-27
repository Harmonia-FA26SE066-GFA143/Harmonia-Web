/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `categoriesApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Skill names are the eight Report 1 FE-03 examples; liturgical entries are illustrative samples only.
 */
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { CatalogItem, CatalogItemValues, LiturgicalCatalog } from '../types'

let skills: CatalogItem[] = [
  { id: 'dev-skill-1', name: 'Soprano', description: 'Bè nữ cao' },
  { id: 'dev-skill-2', name: 'Alto', description: 'Bè nữ trầm' },
  { id: 'dev-skill-3', name: 'Tenor', description: 'Bè nam cao' },
  { id: 'dev-skill-4', name: 'Bass', description: 'Bè nam trầm' },
  { id: 'dev-skill-5', name: 'Guitar' },
  { id: 'dev-skill-6', name: 'Organ' },
  { id: 'dev-skill-7', name: 'Solo Singing', description: 'Hát đơn ca' },
  { id: 'dev-skill-8', name: 'Psalmist', description: 'Xướng Thánh vịnh' },
]

const liturgical: Record<LiturgicalCatalog, CatalogItem[]> = {
  seasons: [
    { id: 'dev-season-1', name: 'Mùa Vọng' },
    { id: 'dev-season-2', name: 'Mùa Giáng Sinh' },
    { id: 'dev-season-3', name: 'Mùa Chay' },
    { id: 'dev-season-4', name: 'Mùa Phục Sinh' },
    { id: 'dev-season-5', name: 'Mùa Thường Niên' },
  ],
  massTypes: [
    { id: 'dev-mass-1', name: 'Lễ Chúa Nhật' },
    { id: 'dev-mass-2', name: 'Lễ Trọng' },
    { id: 'dev-mass-3', name: 'Lễ Kính' },
    { id: 'dev-mass-4', name: 'Lễ Nhớ' },
    { id: 'dev-mass-5', name: 'Lễ ngày thường' },
  ],
  ceremonyTypes: [
    { id: 'dev-ceremony-1', name: 'Chầu Thánh Thể' },
    { id: 'dev-ceremony-2', name: 'Rửa Tội' },
    { id: 'dev-ceremony-3', name: 'Hôn Phối' },
  ],
  eventCategories: [
    { id: 'dev-event-1', name: 'Tĩnh tâm ca đoàn' },
    { id: 'dev-event-2', name: 'Đại hội Thánh nhạc' },
    { id: 'dev-event-3', name: 'Sinh hoạt thường kỳ' },
  ],
}

function upsert(items: CatalogItem[], id: string | undefined, values: CatalogItemValues): [CatalogItem[], CatalogItem] {
  if (!id) {
    const item = { id: nextFixtureId('catalog'), ...values }
    return [[...items, item], item]
  }
  const item = { id, ...values }
  return [items.map((existing) => (existing.id === id ? item : existing)), item]
}

export const listSkillCategoriesFixture = () => readFixture(skills)

export const saveSkillCategoryFixture = (id: string | undefined, values: CatalogItemValues) =>
  writeFixture(() => {
    const [next, item] = upsert(skills, id, values)
    skills = next
    return item
  })

export const listLiturgicalCategoriesFixture = (catalog: LiturgicalCatalog) => readFixture(liturgical[catalog])

export const saveLiturgicalCategoryFixture = (
  catalog: LiturgicalCatalog,
  id: string | undefined,
  values: CatalogItemValues,
) =>
  writeFixture(() => {
    const [next, item] = upsert(liturgical[catalog], id, values)
    liturgical[catalog] = next
    return item
  })
