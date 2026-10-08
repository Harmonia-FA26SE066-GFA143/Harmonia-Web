import { apiRequest } from '@/lib/api/client'
import { toQuery } from '@/lib/api/paging'
import type {
  BasicCatalog,
  CatalogItem,
  CatalogItemValues,
  LiturgicalSeason,
  LiturgicalSeasonValues,
  LookupItem,
  LookupKind,
  Skill,
  SkillValues,
} from '../types'

const lookupPaths: Record<LookupKind, string> = {
  seasons: 'liturgical-seasons',
  massTypes: 'mass-types',
  ceremonyTypes: 'ceremony-types',
  eventCategories: 'event-categories',
  skillCategories: 'skill-categories',
  songThemes: 'song-themes',
  skills: 'skills',
  worshipLocations: 'worship-locations',
}

/** Active entries of one backend lookup (GET /api/lookups/*, any signed-in role), for selects and filters. */
export function listLookup(kind: LookupKind): Promise<LookupItem[]> {
  return apiRequest<LookupItem[]>(`/api/lookups/${lookupPaths[kind]}`)
}

// Admin catalog pages (Harmonia-BE LookupsController): every entry including switched-off ones, and POST / PUT {id}
// for the Admin only. PUT replaces every field, so the forms always send all of them.

function listAll<T>(kind: LookupKind): Promise<T[]> {
  return apiRequest<T[]>(`/api/lookups/${lookupPaths[kind]}${toQuery({ includeInactive: true })}`)
}

function save<T>(kind: LookupKind, id: string | undefined, body: object): Promise<T> {
  return apiRequest<T>(`/api/lookups/${lookupPaths[kind]}${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  })
}

const withDescription = <V extends CatalogItemValues>(values: V): V => ({
  ...values,
  description: values.description?.trim() || null,
})

/** Sorted by name on the server. */
export function listCatalogItems(kind: BasicCatalog): Promise<CatalogItem[]> {
  return listAll(kind)
}

export function saveCatalogItem(kind: BasicCatalog, id: string | undefined, values: CatalogItemValues): Promise<CatalogItem> {
  return save(kind, id, withDescription(values))
}

/** Sorted by name on the server. */
export function listSkills(): Promise<Skill[]> {
  return listAll('skills')
}

export function saveSkill(id: string | undefined, values: SkillValues): Promise<Skill> {
  return save('skills', id, withDescription(values))
}

/** Sorted by start date on the server. */
export function listSeasons(): Promise<LiturgicalSeason[]> {
  return listAll('seasons')
}

export function saveSeason(id: string | undefined, values: LiturgicalSeasonValues): Promise<LiturgicalSeason> {
  return save('seasons', id, values)
}
