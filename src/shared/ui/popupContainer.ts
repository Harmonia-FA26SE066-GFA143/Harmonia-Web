const POPUP_CONTAINER_SELECTOR = '.ant-drawer-body, .ant-modal-body, .hm-head, .hm-sheet-section, .ant-card'

/**
 * Resolves a safe popup container near the trigger (R2.4 / G4-16), skipping any ancestor with
 * `overflow: hidden | clip` so Select/DatePicker/Dropdown overlays stay adjacent without clipping.
 */
export function getPopupContainer(triggerNode?: HTMLElement): HTMLElement {
  if (!triggerNode) return document.body
  let candidate: HTMLElement | null = triggerNode.closest(POPUP_CONTAINER_SELECTOR)
  while (candidate) {
    const style = typeof window !== 'undefined' ? window.getComputedStyle(candidate) : undefined
    const clipsPopup =
      Boolean(style) &&
      (style!.overflow === 'hidden' ||
        style!.overflow === 'clip' ||
        style!.overflowY === 'hidden' ||
        style!.overflowY === 'clip')
    if (!clipsPopup) return candidate
    candidate = candidate.parentElement?.closest(POPUP_CONTAINER_SELECTOR) ?? null
  }
  return (triggerNode.closest('.hm-main') as HTMLElement | null) ?? document.body
}

/** Alias kept for section-scoped selects/dropdowns. */
export const getSectionPopupContainer = getPopupContainer

/** Standard Select / TreeSelect / DatePicker popup props (R2.4, G4-16). */
export const SELECT_POPUP_PROPS = {
  placement: 'bottomLeft' as const,
  getPopupContainer,
}
