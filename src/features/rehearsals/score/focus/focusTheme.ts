import { theme, type ThemeConfig } from 'antd'
import type { CSSProperties } from 'react'
import { colors, media, spine } from '@/styles/tokens'

/**
 * The dark look of focus mode: the missal's bookcloth (`media.backdrop`, the dark burgundy of the hero scrim) with
 * pale ink for text, rings and the play button (as `spineTheme` does: no gold, which the brief keeps off controls), from
 * tokens that already exist. The sheet keeps its ivory paper: music is read on
 * light. Nothing here is new to the design system except the derived values marked "local" (RAIL, PRESSED and the
 * custom properties at the foot), which are listed in the P7 report as a request for Track V.
 */
const ACCENT = spine.text
const INK_ON_ACCENT = media.backdrop
/** local: the slider rail, 3.3:1 on the ground (`spine.selected` is 1.8:1, below the 3:1 of WCAG 1.4.11 for a control's extent). */
const RAIL = '#7D5F67'
/** local: the pressed play button, one step darker than `spine.text` (10.96:1 on the ground; ink `media.backdrop` on it 10.96:1). */
const PRESSED = '#D5C0C4'
/** Hover is the white of the design system (`colors.surface`): 18.92:1 on the ground, ink on it 18.92:1. */
const HOVER = colors.surface

/** Ant Design side, for the controls inside the mode (nested under the app's ConfigProvider, so the rest is inherited). */
export const focusTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: ACCENT,
    colorBgBase: media.backdrop,
    colorBgContainer: spine.background,
    colorBgElevated: spine.hover,
    colorText: spine.text,
    colorTextSecondary: spine.groupTitle,
    colorTextTertiary: spine.groupTitle,
    colorTextDescription: spine.groupTitle,
    colorTextPlaceholder: spine.groupTitle,
    colorTextDisabled: spine.groupTitle,
    // Control edges must be 3:1 on the ground to be seen (WCAG 1.4.11): 8.8:1 here.
    colorBorder: spine.groupTitle,
    colorBorderSecondary: spine.groupTitle,
    colorPrimaryBorder: ACCENT,
    controlOutline: 'rgba(234, 218, 221, 0.35)',
    controlItemBgActive: spine.selected,
    controlItemBgHover: spine.hover,
  },
  components: {
    // Pale fill, ink on it: the play button keeps its weight on the dark ground.
    Button: { primaryColor: INK_ON_ACCENT, colorPrimaryHover: HOVER, colorPrimaryActive: PRESSED, colorPrimaryTextHover: INK_ON_ACCENT },
    Slider: { trackBg: ACCENT, trackHoverBg: HOVER, handleColor: ACCENT, handleActiveColor: HOVER, railBg: RAIL, railHoverBg: RAIL },
  },
}

/**
 * The theme outside the mode. Not `undefined`: Ant Design wraps its children differently with and without a `theme`
 * prop, which would rebuild the sheet (and its engine state) every time the mode turns on or off.
 */
export const inheritTheme: ThemeConfig = {}

/** CSS side: custom properties for `focusMode.css`, set on the section root only while the mode is on. */
export const focusVars = {
  '--hm-focus-bg': media.backdrop,
  '--hm-focus-text': spine.text,
  '--hm-focus-muted': spine.groupTitle,
  '--hm-focus-ring': ACCENT,
  /** local: pale ink at 8% over the ground, for the wash of `hm-glow` (the shared one is burgundy and vanishes on dark). */
  '--hm-focus-wash': 'rgba(234, 218, 221, 0.08)',
  /** local: error text on the dark ground (the light mode uses `colors.primaryHover`, 1.8:1 here). */
  '--hm-focus-danger': '#F4B6BF',
  /** local: lift shadow that shows on dark; the shared one is 4–6% black. */
  '--hm-lift-shadow': '0 8px 14px -4px rgba(0, 0, 0, 0.55)',
} as CSSProperties
