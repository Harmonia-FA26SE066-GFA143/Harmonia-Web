/**
 * Save confirmed (DESIGN "Motion", 25% share, owner 2026-11-14): after any successful save, the row of the record it
 * touched washes once, so the eye finds it in the list the drawer closed back to. Rows are found by `data-row-key`,
 * which every antd Table row carries and custom lists set themselves. A data attribute, not a class, so React's next
 * render of the row leaves it alone.
 */
const attribute = 'data-just-saved'
const holdMs = 1800
const lookForMs = 3000
const stepMs = 100

/** The id a mutation was about: the saved record's `id`, else the variables' id. */
export function savedId(data: unknown, variables: unknown): string | undefined {
  const idOf = (value: unknown) => {
    if (typeof value === 'string' && value) return value
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id
    return undefined
  }
  return idOf(data) ?? idOf(variables)
}

/** Waits for the row (a new one appears after the list refetches), then marks it for one wash. */
export function highlightSavedRow(id: string | undefined) {
  if (!id || typeof document === 'undefined' || typeof CSS === 'undefined' || !CSS.escape) return
  const selector = `[data-row-key="${CSS.escape(id)}"]`
  const started = Date.now()
  const look = () => {
    // The page (or a test's document) may be gone by the time a retry fires.
    if (typeof document === 'undefined') return
    const row = document.querySelector<HTMLElement>(selector)
    if (row) {
      row.removeAttribute(attribute)
      // Restart the wash if the same row is saved twice in a row: reading layout forces a reflow between the two.
      row.getBoundingClientRect()
      row.setAttribute(attribute, '')
      setTimeout(() => row.removeAttribute(attribute), holdMs)
    } else if (Date.now() - started < lookForMs) {
      setTimeout(look, stepMs)
    }
  }
  look()
}
