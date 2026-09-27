/**
 * One entry of an Admin-configured catalog: skill categories (Report 1 FE-49) or liturgical categories (FE-50).
 * Report 1 names the catalogs but not their fields; name + optional description follow the base Stitch modals.
 * TBD: Backend API missing – identifiers, field names, uniqueness and delete/deactivate lifecycle are not defined.
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
