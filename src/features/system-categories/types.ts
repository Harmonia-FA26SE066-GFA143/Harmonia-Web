/**
 * Admin catalogs (Report 1 FE-49, FE-50) as `/api/lookups` returns them to the Admin (Harmonia-BE LookupsController).
 * Entries are never deleted: other records reference them, so `isActive = false` switches one off and hides it from
 * the selects of other pages (LookupService). This supersedes "the Admin deletes catalog entries"
 * (choir-skills.md, decision 2026-09-30).
 */
export interface CatalogEntry {
  id: string
  name: string
  description?: string | null
  isActive: boolean
}

/** Mass types, ceremony types, event categories and skill categories: a name and a description (`SaveCatalogItemRequest`). */
export interface CatalogItem extends CatalogEntry {
  description: string | null
}

export type CatalogItemValues = Omit<CatalogItem, 'id'>

/** A skill belongs to one skill category; its name is unique within the category (`SaveSkillRequest`). */
export interface Skill extends CatalogItem {
  categoryId: string
}

export type SkillValues = Omit<Skill, 'id'>

/**
 * A liturgical season (`SaveLiturgicalSeasonRequest`): dates (`DateOnly`, YYYY-MM-DD) and a colour instead of a
 * description. Names repeat every year; the dates must not overlap another active season.
 */
export interface LiturgicalSeason extends CatalogEntry {
  startDate: string
  endDate: string
  /** `#RRGGBB`. */
  colorHex: string | null
}

export type LiturgicalSeasonValues = Omit<LiturgicalSeason, 'id'>

/** A liturgical slot of a Mass (`SaveLiturgicalSlotRequest`): slots are listed by their default order, then name. */
export interface LiturgicalSlot extends CatalogEntry {
  defaultOrder: number
}

export type LiturgicalSlotValues = Omit<LiturgicalSlot, 'id'>

/** A worship location (`SaveWorshipLocationRequest`) with an optional address. */
export interface WorshipLocation extends CatalogEntry {
  address: string | null
}

export type WorshipLocationValues = Omit<WorshipLocation, 'id'>

/** The liturgical catalogs of FE-50: the four of Report 1 plus song themes, slots and locations (LookupsController). */
export type LiturgicalCatalog =
  | 'seasons'
  | 'massTypes'
  | 'ceremonyTypes'
  | 'eventCategories'
  | 'songThemes'
  | 'liturgicalSlots'
  | 'worshipLocations'

/** Catalogs whose entries have only a name and a description. */
export type BasicCatalog = 'massTypes' | 'ceremonyTypes' | 'eventCategories' | 'songThemes' | 'skillCategories'

/** Backend lookups, every one editable by the Admin. */
export type LookupKind = LiturgicalCatalog | 'skillCategories' | 'skills'

/** An active lookup row, as offered in selects; skills also carry their category. */
export interface LookupItem {
  id: string
  name: string
  categoryId?: string
  /** Liturgical slots only: place in the Mass. */
  defaultOrder?: number
}

/** Fixed on every environment (Harmonia-BE doc/api.md, Lookups); instrument requirements accept only this category. */
export const instrumentSkillCategoryId = '0904ad8b-87f2-46c5-9938-f6cfbf0fa70b'
