import { useEffect } from 'react'
import type { PlaybackClock } from '../clock/usePlaybackClock'
import type { PlaybackTimeline } from '../timeline/types'
import { findNoteAt } from './findNoteAt'
import { nearestOccurrence } from './nearestOccurrence'
import './scoreInteraction.css'

export type NoteSeekClock = Pick<PlaybackClock, 'seek' | 'getTime'>

/** A pointer that has been this far (CSS px) from where it pressed, at any moment, was dragging: not a click. */
const DRAG_PX = 5

/**
 * Click a note to jump the playback there. One delegated listener on the viewer root, so a relayout (which replaces every
 * note) needs no re-binding. The note id is the SVG id, which is the canonical id `onsets` is keyed by (repeats are
 * already mapped to their original by `parseTimemap`).
 * Which note: the one the click landed on (any part of it, the stem too), else the nearest notehead within
 * `NOTE_TOLERANCE_PX` of the point; notes with no onset do not count. Which pass of a repeated note: the onset nearest in
 * time to the current time (`nearestOccurrence`). Only the main button without a modifier; a drag (the pointer was ever
 * more than `DRAG_PX` from the press, even if it came back) or text selected by the gesture itself is not a click.
 * Seeking keeps the playing/paused state.
 */
export function useNoteSeek(clock: NoteSeekClock, viewerRoot: HTMLElement | null, onsets: PlaybackTimeline['onsets'] | null) {
  const { seek, getTime } = clock

  useEffect(() => {
    if (!viewerRoot || !onsets) return

    const hasOnsets = (id: string) => (onsets.get(id)?.length ?? 0) > 0
    // One press at a time, the first pointer's: events of any other pointer are not its business. `released`: the pointer
    // has come up inside the viewer and its click is on the way (it reads the press, which is why it is kept until then).
    let press: { pointerId: number; x: number; y: number; dragged: boolean; released: boolean; selectedBefore: boolean } | null = null
    // Text selected in the sheet: a selection with an end in it (a drag that began there may have ended anywhere). One that
    // touches nothing of the sheet, say the side menu selected by an earlier drag, is not its business.
    const sheetTextSelected = () => {
      const selection = window.getSelection()
      return !!selection && !selection.isCollapsed && [selection.anchorNode, selection.focusNode].some((node) => node && viewerRoot.contains(node))
    }

    // From a press to its release the pointer is followed on the window, wherever it goes (out of the viewer too); nothing
    // is listened to for a pointer that is merely passing over the sheet.
    const own = (event: PointerEvent) => press !== null && event.pointerId === press.pointerId
    const onPointerMove = (event: PointerEvent) => {
      if (!press || !own(event) || press.dragged) return
      press.dragged = Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_PX
    }
    // The gesture was lost (cancelled, capture taken away, window blurred) before its release. The browser may still send a
    // click for it, with no press behind it; that would read as a plain click. So no click counts until the next press.
    let gestureLost = false
    const forget = () => {
      press = null
      gestureLost = true
      detach()
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!press || !own(event)) return
      press.released = true
      detach()
      // Released outside the viewer: no click will come to read the press.
      if (!(event.target instanceof Node && viewerRoot.contains(event.target))) press = null
    }
    const onPointerCancel = (event: PointerEvent) => {
      if (own(event)) forget()
    }
    // After a pointerup (touch releases its implicit capture then) the click is still on the way: only an unreleased press is lost.
    const onLostCapture = (event: PointerEvent) => {
      if (own(event) && !press?.released) forget()
    }
    const windowEvents = [
      ['pointermove', onPointerMove],
      ['pointerup', onPointerUp],
      ['pointercancel', onPointerCancel],
      ['lostpointercapture', onLostCapture],
      ['blur', forget],
    ] as const
    function detach() {
      for (const [type, listener] of windowEvents) window.removeEventListener(type, listener as EventListener)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (press && !press.released && !own(event)) return // a second pointer: the first keeps the press
      detach()
      gestureLost = false
      press = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragged: false, released: false, selectedBefore: sheetTextSelected() }
      for (const [type, listener] of windowEvents) window.addEventListener(type, listener as EventListener)
    }
    const onClick = (event: MouseEvent) => {
      const { dragged, selectedBefore } = press ?? { dragged: false, selectedBefore: false }
      press = null
      detach()
      if (gestureLost || dragged || event.button !== 0 || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return
      // Text selected by this gesture (a double click selects a word) is not a click; one left from an earlier gesture is not
      // this click's business: the browser has not always cleared it yet when `click` arrives.
      if (sheetTextSelected() && !selectedBefore) return
      const hit = event.target instanceof Element ? event.target.closest('g.note') : null
      const direct = hit && viewerRoot.contains(hit) && hasOnsets(hit.id) ? hit : null
      const note = direct ?? findNoteAt(viewerRoot, event.clientX, event.clientY, hasOnsets)
      if (!note) return
      const time = nearestOccurrence(onsets.get(note.id) ?? [], getTime())
      if (time !== undefined) seek(time)
    }

    viewerRoot.addEventListener('pointerdown', onPointerDown)
    viewerRoot.addEventListener('click', onClick)
    return () => {
      viewerRoot.removeEventListener('pointerdown', onPointerDown)
      viewerRoot.removeEventListener('click', onClick)
      detach()
    }
  }, [getTime, onsets, seek, viewerRoot])
}
