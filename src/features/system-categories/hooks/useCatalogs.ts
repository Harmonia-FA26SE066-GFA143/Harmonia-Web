import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSlotRequirements,
  listCatalogItems,
  listLocations,
  listMassSchedules,
  listSeasons,
  listSkills,
  listSlots,
  listSongThemes,
  saveCatalogItem,
  saveLocation,
  saveMassSchedule,
  saveSeason,
  saveSkill,
  saveSlot,
  saveSlotRequirements,
  saveSongTheme,
} from '../api/categoriesApi'
import { themePath } from '../songThemeTree'
import type { BasicCatalog, CatalogItemValues, LookupKind, MassScheduleValues, SlotRequirementValue } from '../types'

/** Values for the add/edit drawer; `id` is present when editing an existing entry. */
export interface SaveCatalogEntry<V> {
  id?: string
  values: V
}

const catalogKey = (kind: LookupKind) => ['system-categories', kind] as const

export function useCatalogItems(kind: BasicCatalog) {
  return useQuery({ queryKey: catalogKey(kind), queryFn: () => listCatalogItems(kind) })
}

export function useSkills() {
  return useQuery({ queryKey: catalogKey('skills'), queryFn: listSkills })
}

export function useSeasons() {
  return useQuery({ queryKey: catalogKey('seasons'), queryFn: listSeasons })
}

export function useSlots() {
  return useQuery({ queryKey: catalogKey('liturgicalSlots'), queryFn: listSlots })
}

export function useLocations() {
  return useQuery({ queryKey: catalogKey('worshipLocations'), queryFn: listLocations })
}

/** Every theme, each sub-theme right after its parent (sorted by the path from the top). */
export function useSongThemes() {
  return useQuery({
    queryKey: catalogKey('songThemes'),
    queryFn: listSongThemes,
    select: (themes) => [...themes].sort((a, b) => themePath(themes, a.id).localeCompare(themePath(themes, b.id), 'vi')),
  })
}

const slotRequirementsKey = (slotId: string) => ['system-categories', 'slot-requirements', slotId] as const

export function useSlotRequirements(slotId: string) {
  return useQuery({ queryKey: slotRequirementsKey(slotId), queryFn: () => getSlotRequirements(slotId) })
}

export function useSaveSlotRequirements(slotId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requirements: SlotRequirementValue[]) => saveSlotRequirements(slotId, requirements),
    onSuccess: (saved) => queryClient.setQueryData(slotRequirementsKey(slotId), saved),
  })
}

function useSave<T, V>(kind: LookupKind, save: (id: string | undefined, values: V) => Promise<T>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: SaveCatalogEntry<V>) => save(id, values),
    // The selects of other pages read the active lookups; a skill category also decides which skills they offer.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogKey(kind) }),
        queryClient.invalidateQueries({ queryKey: ['lookups'] }),
      ]),
  })
}

export function useSaveCatalogItem(kind: BasicCatalog) {
  return useSave(kind, (id, values: CatalogItemValues) => saveCatalogItem(kind, id, values))
}

export function useSaveSkill() {
  return useSave('skills', saveSkill)
}

export function useSaveSeason() {
  return useSave('seasons', saveSeason)
}

export function useSaveSlot() {
  return useSave('liturgicalSlots', saveSlot)
}

export function useSaveSongTheme() {
  return useSave('songThemes', saveSongTheme)
}

export function useSaveLocation() {
  return useSave('worshipLocations', saveLocation)
}

const massSchedulesKey = ['system-categories', 'mass-schedules'] as const

/** Fixed Mass times; the Parish Priest reads them before generating events. */
export function useMassSchedules() {
  return useQuery({ queryKey: massSchedulesKey, queryFn: listMassSchedules })
}

export function useSaveMassSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: SaveCatalogEntry<MassScheduleValues>) => saveMassSchedule(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: massSchedulesKey }),
  })
}
