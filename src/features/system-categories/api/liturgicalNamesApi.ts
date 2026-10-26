import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type {
  LiturgicalNameKind,
  LiturgicalNameTranslation,
  LiturgicalNameTranslationValues,
  UntranslatedLiturgicalName,
} from '../types'

// `/api/liturgical-name-translations` (Harmonia-BE LiturgicalNameTranslationsController), Admin only. Every role reads the
// result through the `…Vi` names of the liturgical days; days and Sundays of a season are translated by rule.

export interface LiturgicalNameFilters {
  /** Matches either name, ignoring case and diacritics. */
  keyword?: string
  kind?: LiturgicalNameKind
}

export function listLiturgicalNames(
  filters: LiturgicalNameFilters,
  page: { pageNumber: number; pageSize: number },
): Promise<PagedList<LiturgicalNameTranslation>> {
  return apiRequest<PagedList<LiturgicalNameTranslation>>(
    `/api/liturgical-name-translations${toQuery({ keyword: filters.keyword?.trim() || undefined, kind: filters.kind, ...page })}`,
  )
}

/** Names of the synced calendar with no translation yet. */
export function listUntranslatedNames(): Promise<UntranslatedLiturgicalName[]> {
  return apiRequest<UntranslatedLiturgicalName[]>('/api/liturgical-name-translations/missing')
}

export function saveLiturgicalName(id: string | undefined, values: LiturgicalNameTranslationValues): Promise<LiturgicalNameTranslation> {
  const path = '/api/liturgical-name-translations'
  return apiRequest<LiturgicalNameTranslation>(id ? `${path}/${id}` : path, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...values, englishName: values.englishName.trim(), vietnameseName: values.vietnameseName.trim() }),
  })
}

/** The name shows in English again unless a rule covers it. */
export async function deleteLiturgicalName(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/liturgical-name-translations/${id}`, { method: 'DELETE' })
}
