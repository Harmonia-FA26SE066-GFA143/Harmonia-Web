/**
 * One entry of an Admin-configured catalog: skill categories (Report 1 FE-49) or liturgical categories (FE-50).
 * Report 1 names the catalogs but not their fields; name + optional description follow the base Stitch modals.
 * The backend lookups return id, name and an optional description; liturgical seasons return start and end dates
 * and a colour instead of a description. Uniqueness and the deactivate lifecycle stay TBD until catalog writes exist.
 */
export interface CatalogItem {
  id: string
  name: string
  description?: string
}

export interface CatalogItemValues {
  name: string
  description?: string
}

/** The four liturgical catalogs listed in FE-50. */
export type LiturgicalCatalog = 'seasons' | 'massTypes' | 'ceremonyTypes' | 'eventCategories'

/** Backend lookups offered as select options: the liturgical catalogs plus song themes and skills. */
export type LookupKind = LiturgicalCatalog | 'songThemes' | 'skills'
