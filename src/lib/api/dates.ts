/**
 * A backend `DateTime`. Values read back from the database can lack the `Z` suffix although they are UTC
 * (tbd-backlog B7), and the browser would read such a string as local time; it is read as UTC here.
 */
export function parseUtc(value: string): Date {
  return new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`)
}
