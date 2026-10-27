import { apiRequest } from '@/lib/api/client'
import { toQuery } from '@/lib/api/paging'
import type {
  BasicCatalog,
  CatalogItem,
  CatalogItemValues,
  LiturgicalSeason,
  LiturgicalSeasonValues,
  LiturgicalSlot,
  LiturgicalSlotValues,
  LookupItem,
  LookupKind,
  MassSchedule,
  MassScheduleValues,
  Skill,
  SkillValues,
  SlotRequirement,
  SlotRequirementValue,
  SongTheme,
  SongThemeValues,
  WorshipLocation,
  WorshipLocationValues,
} from '../types'

const lookupPaths: Record<LookupKind, string> = {
  seasons: 'liturgical-seasons',
  massTypes: 'mass-types',
  ceremonyTypes: 'ceremony-types',
  eventCategories: 'event-categories',
  skillCategories: 'skill-categories',
  songThemes: 'song-themes',
  liturgicalSlots: 'liturgical-slots',
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
  const path = `/api/lookups/${lookupPaths[kind]}`
  return apiRequest<T>(id ? `${path}/${id}` : path, {
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

/** Sorted by name on the server; the tree comes from `parentId`. */
export function listSongThemes(): Promise<SongTheme[]> {
  return listAll('songThemes')
}

export function saveSongTheme(id: string | undefined, values: SongThemeValues): Promise<SongTheme> {
  return save('songThemes', id, { ...withDescription(values), parentId: values.parentId ?? null })
}

/** Sorted by start date on the server. */
export function listSeasons(): Promise<LiturgicalSeason[]> {
  return listAll('seasons')
}

export function saveSeason(id: string | undefined, values: LiturgicalSeasonValues): Promise<LiturgicalSeason> {
  return save('seasons', id, values)
}

/** Sorted by default order, then name, on the server. */
export function listSlots(): Promise<LiturgicalSlot[]> {
  return listAll('liturgicalSlots')
}

export function saveSlot(id: string | undefined, values: LiturgicalSlotValues): Promise<LiturgicalSlot> {
  return save('liturgicalSlots', id, values)
}

/** Any signed-in role reads; only the Admin writes (`PUT` replaces the whole set). */
export function getSlotRequirements(slotId: string): Promise<SlotRequirement[]> {
  return apiRequest<SlotRequirement[]>(`/api/lookups/liturgical-slots/${slotId}/requirements`)
}

export function saveSlotRequirements(slotId: string, requirements: SlotRequirementValue[]): Promise<SlotRequirement[]> {
  return apiRequest<SlotRequirement[]>(`/api/lookups/liturgical-slots/${slotId}/requirements`, {
    method: 'PUT',
    body: JSON.stringify({ requirements }),
  })
}

/** Sorted by name on the server. */
export function listLocations(): Promise<WorshipLocation[]> {
  return listAll('worshipLocations')
}

export function saveLocation(id: string | undefined, values: WorshipLocationValues): Promise<WorshipLocation> {
  return save('worshipLocations', id, { ...values, address: values.address?.trim() || null })
}

// `api/mass-schedules` (Harmonia-BE MassSchedulesController): read by the Admin and the Parish Priest, written by the
// Admin. `time` is a TimeOnly (HH:mm:ss) on the wire.

interface MassScheduleDto extends Omit<MassSchedule, 'time'> {
  time: string
}

const toMassSchedule = (dto: MassScheduleDto): MassSchedule => ({ ...dto, time: dto.time.slice(0, 5) })

/** Every schedule, switched-off ones included, Sunday first then by time. */
export async function listMassSchedules(): Promise<MassSchedule[]> {
  return (await apiRequest<MassScheduleDto[]>('/api/mass-schedules')).map(toMassSchedule)
}

/** POST takes no `isActive` (a new schedule is active); PUT replaces every field. */
export async function saveMassSchedule(id: string | undefined, values: MassScheduleValues): Promise<MassSchedule> {
  const { isActive, ...fields } = values
  const body = { ...fields, time: `${values.time}:00`, title: values.title?.trim() || null }
  const dto = await apiRequest<MassScheduleDto>(id ? `/api/mass-schedules/${id}` : '/api/mass-schedules', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(id ? { ...body, isActive } : body),
  })
  return toMassSchedule(dto)
}
