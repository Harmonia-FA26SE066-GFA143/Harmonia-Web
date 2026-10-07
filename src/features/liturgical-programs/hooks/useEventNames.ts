import { useCatalogOptions, type CatalogOption } from '@/features/system-categories'
import type { LiturgicalEvent } from '../types'

const byId = (options: CatalogOption[]) => new Map(options.map((option) => [option.value, option.label]))

/**
 * Names of the catalog entries an event refers to, from the lookups (active entries only: a switched-off entry has
 * no name here). `eventName` labels an event by its title, else by its Mass or ceremony type, which the backend
 * requires one of.
 */
export function useEventNames() {
  const names = {
    season: byId(useCatalogOptions('seasons')),
    massType: byId(useCatalogOptions('massTypes')),
    ceremonyType: byId(useCatalogOptions('ceremonyTypes')),
    category: byId(useCatalogOptions('eventCategories')),
  }
  const name = (kind: keyof typeof names, id?: string) => (id ? names[kind].get(id) : undefined)
  const eventName = (event: LiturgicalEvent) =>
    event.title || name('massType', event.massTypeId) || name('ceremonyType', event.ceremonyTypeId) || 'Sự kiện phụng vụ'
  return { name, eventName }
}
