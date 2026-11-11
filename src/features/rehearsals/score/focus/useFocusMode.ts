import { useCallback, useEffect, useState, type RefObject } from 'react'
import { isTypingTarget } from '../controls/useScoreShortcuts'

/** A control whose list or popup is open: Esc closes that first (Ant Design Select, combobox pattern). */
const OPEN_POPUP = '[aria-expanded="true"]'

/** Holds the page scroll; returns what puts it back. An inline style, not a class: nothing for a stylesheet to forget. */
function holdPageScroll(): () => void {
  const { body } = document
  const before = body.style.overflow
  body.style.overflow = 'hidden'
  return () => {
    body.style.overflow = before
  }
}

/**
 * Makes everything beside `root` inert (no focus, no clicks, hidden from screen readers): the siblings of `root` and of each
 * of its ancestors, up to the app root. The children of `<body>` itself are left alone: a dropdown or a message that Ant
 * Design mounts there must stay usable. Returns what takes the attribute off again, only where this call put it.
 */
function hideAround(root: HTMLElement): () => void {
  const hidden: Element[] = []
  for (let node: HTMLElement | null = root; node?.parentElement && node.parentElement !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.hasAttribute('inert')) continue
      sibling.setAttribute('inert', '')
      hidden.push(sibling)
    }
  }
  return () => {
    for (const element of hidden) element.removeAttribute('inert')
  }
}

/**
 * Focus mode of the practice section: `root` fills the screen (the stylesheet does that) and this hook does the rest.
 * F turns it on and off, Esc leaves it. Both are heard only inside `root`, and not with a modifier, while composing, when
 * a field uses the key to type, or (Esc) when a popup is open and needs it to close. While on, the page behind is inert and
 * does not scroll, the focus moves to `root`, and leaving gives it back to `returnTo` (the button that turns the mode on).
 * Everything it sets is taken off again when it turns off, when `root` goes away and on unmount.
 */
export function useFocusMode(root: HTMLElement | null, returnTo: RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false)
  const active = on && root !== null
  const toggle = useCallback(() => setOn((current) => !current), [])
  const exit = useCallback(() => setOn(false), [])

  useEffect(() => {
    if (!root) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return
      const target = event.target instanceof Element ? event.target : null
      if (event.key === 'Escape') {
        if (!active || target?.closest(OPEN_POPUP)) return
        event.preventDefault()
        exit()
        return
      }
      if (event.shiftKey || event.repeat || event.key.toLowerCase() !== 'f' || isTypingTarget(target)) return
      event.preventDefault()
      toggle()
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [root, active, toggle, exit])

  useEffect(() => {
    if (!active || !root) return
    const button = returnTo.current
    const releaseScroll = holdPageScroll()
    const releaseOthers = hideAround(root)
    root.focus({ preventScroll: true })
    return () => {
      releaseOthers()
      releaseScroll()
      // Gone with the section (unmount, another state): there is no button to return to and nothing to steal.
      if (button?.isConnected) button.focus()
    }
  }, [active, root, returnTo])

  return { active, toggle, exit }
}
