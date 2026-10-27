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
 * A song theme (`SongThemeDto`): themes form a tree of any depth (BE d1ca63e), and filtering songs by a theme also
 * finds the songs of its sub-themes. A theme never sits under itself or a descendant, and an active one never under a
 * switched-off one (SONG_THEME_PARENT_INVALID); a theme with active sub-themes cannot be switched off
 * (SONG_THEME_HAS_ACTIVE_CHILDREN).
 */
export interface SongTheme extends CatalogItem {
  parentId: string | null
}

export type SongThemeValues = Omit<SongTheme, 'id'>

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

/**
 * People a liturgical slot needs whatever song fills it, e.g. a psalmist for the psalm (`LiturgicalSlotRequirementDto`).
 * Pre-filled into the personnel requirements of a song list; one row per skill, 1–50 people.
 */
export interface SlotRequirement {
  skillId: string
  skillName: string
  requiredCount: number
}

export type SlotRequirementValue = Pick<SlotRequirement, 'skillId' | 'requiredCount'>

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
export type BasicCatalog = 'massTypes' | 'ceremonyTypes' | 'eventCategories' | 'skillCategories'

/** Backend lookups, every one editable by the Admin. */
export type LookupKind = LiturgicalCatalog | 'skillCategories' | 'skills'

/** An active lookup row, as offered in selects; skills also carry their category. */
export interface LookupItem {
  id: string
  name: string
  categoryId?: string
  /** Liturgical slots only: place in the Mass. */
  defaultOrder?: number
  /** Song themes only: the theme above it, or null at the top. */
  parentId?: string | null
}

/** Fixed on every environment (Harmonia-BE doc/api.md, Lookups); instrument requirements accept only this category. */
export const instrumentSkillCategoryId = '0904ad8b-87f2-46c5-9938-f6cfbf0fa70b'

/** `System.DayOfWeek` names, as the backend sends them. */
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

/** Sunday first, as the backend sorts mass schedules. */
export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  Sunday: 'Chúa nhật',
  Monday: 'Thứ Hai',
  Tuesday: 'Thứ Ba',
  Wednesday: 'Thứ Tư',
  Thursday: 'Thứ Năm',
  Friday: 'Thứ Sáu',
  Saturday: 'Thứ Bảy',
}

/**
 * A fixed weekly Mass time of the parish (`MassScheduleDto`, `api/mass-schedules`): the Parish Priest generates draft
 * events from the active ones. Day + time + location is unique; never deleted, switched off with `isActive`.
 */
export interface MassSchedule {
  id: string
  dayOfWeek: DayOfWeek
  /** Local time, HH:mm. */
  time: string
  massTypeId: string
  locationId: string
  title: string | null
  isActive: boolean
}

export type MassScheduleValues = Omit<MassSchedule, 'id'>

/** `LiturgicalNameKind`: what an English word of the liturgical calendar names. */
export type LiturgicalNameKind = 'Celebration' | 'Rank' | 'Season'

export const liturgicalNameKindLabels: Record<LiturgicalNameKind, string> = {
  Celebration: 'Tên lễ',
  Rank: 'Bậc lễ',
  Season: 'Mùa phụng vụ',
}

/**
 * A Vietnamese name for an English word of the liturgical calendar (`LiturgicalNameTranslationDto`, Admin). Unique by
 * kind + English name; the English name must be written exactly as the calendar returns it.
 */
export interface LiturgicalNameTranslation {
  id: string
  kind: LiturgicalNameKind
  englishName: string
  vietnameseName: string
}

export type LiturgicalNameTranslationValues = Omit<LiturgicalNameTranslation, 'id'>

/** A name of the synced calendar that still shows in English (`GET …/missing`). */
export interface UntranslatedLiturgicalName {
  kind: LiturgicalNameKind
  englishName: string
}
