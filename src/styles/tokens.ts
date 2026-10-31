/**
 * Harmonia design tokens.
 * Sources: .ai-skills/design/design-system.md (workspace root) for colors; Stitch DESIGN(2).md
 * (project 5445464059092912576) for typography, sizing and layout where design-system.md is silent.
 * Where the two disagree, design-system.md wins (see docs/stitch-screen-map.md, phase 0 notes).
 * Single source for colors and sizes; the Ant Design theme and custom styles both read from here.
 */
export const colors = {
  /** A warm off-white page; colour is kept for the data, not the ground (2026-10-30). */
  background: '#F7F4F4',
  surface: '#FFFFFF',
  softSurface: '#F5F1F1',
  /** The selected row of the navigation and of lists: one grey step, ink text. */
  selectedSurface: '#EEE8E9',
  border: '#E6DEDF',
  mutedBorder: '#D3C8CA',
  /** Ink, never pure black. */
  textPrimary: '#1E1A1C',
  textBody: '#3F3639',
  textMuted: '#6B5F62',
  /** Still 5.5:1 on the grey of a disabled control: a disabled button must be readable, only not clickable. */
  textDisabled: '#5F6368',
  primary: '#8E3B4B',
  primaryHover: '#762E3D',
  primarySoft: 'rgba(142, 59, 75, 0.08)',
  primaryFocus: 'rgba(142, 59, 75, 0.25)',
  /** Reading surfaces (redesign brief 2026-10-31): season banner, event detail, song-list review. Not a page ground. */
  ivory: '#F7F4ED',
  parchment: '#EEE8DC',
} as const

/**
 * The sidebar as the songbook's dark burgundy spine (owner 2026-10-31, DESIGN.md "Navigation"). Text 10.4:1, selected
 * row 10.3:1, group titles 6.5:1.
 */
export const spine = {
  background: '#4A1D27',
  hover: '#5A2431',
  selected: '#6A2C39',
  text: '#EADADD',
  groupTitle: '#C9A9B0',
} as const

/**
 * Decorative gold (brief 2026-10-31): ribbon edges, hairlines, Christmas and Easter banners. `line` is never text
 * (2.15:1 on ivory) and gold never marks a status. `ink` is the only gold for text: 5.8:1 on ivory but 4.46:1 on
 * `soft`, so text on `soft` stays `colors.textPrimary`.
 */
export const gold = {
  line: '#C5A46D',
  soft: '#E6D7B5',
  ink: '#7A5A1E',
} as const

/**
 * Liturgical-season colours, only in the season banner and a season chip, always beside the season name. `cloth`
 * carries white text (purple 5.9:1, green 4.6:1, red 6.3:1); `ink` is the season's text colour on ivory (7.6:1, 6.4:1).
 * Season green stays apart from the rehearsal cloth (ΔE 16, hue 140° against 168°).
 */
export const seasonColors = {
  purple: { cloth: '#765A83', ink: '#5E4469' },
  green: { cloth: '#657B62', ink: '#4A5E48' },
  /** Easter Triduum (interpreted, awaiting the owner). Unused: the backend files the Triduum under Lent. */
  red: { cloth: '#A53D3D', ink: '#A53D3D' },
} as const

/**
 * Text and scrims over photos and video (landing hero, sign-in image). The scrim is a dark burgundy ink, so the
 * picture keeps the brand's warmth; contrast was measured on the brightest frames behind the text.
 */
export const media = {
  /** Shown behind the poster until it loads. */
  backdrop: '#1C0C11',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.88)',
  /** Hero: darkest on the text side (left), opening up to the right where the light falls. */
  heroScrim: 'linear-gradient(90deg, rgba(28, 12, 17, 0.8) 0%, rgba(28, 12, 17, 0.66) 50%, rgba(28, 12, 17, 0.2) 100%)',
  /** Sign-in image: clear at the top, dark under the brand at the bottom. */
  imageScrim: 'linear-gradient(180deg, rgba(28, 12, 17, 0.05) 30%, rgba(28, 12, 17, 0.82) 100%)',
  /** Edge of controls drawn on the media (pause button). */
  controlBorder: 'rgba(255, 255, 255, 0.4)',
} as const

/**
 * One colour per area of work, used on its data only (readiness steps, chips, waiting counts), never on the shell
 * (2026-10-30). Each area has its cloth (marks, filled steps), a pale tint with a darker edge (chips, waiting cells)
 * and a dark ink for text on the tint (7:1 or more).
 */
export type SectionKey = 'liturgy' | 'rehearsal' | 'practice' | 'roster' | 'attention'

export interface SectionColors {
  cloth: string
  tint: string
  border: string
  ink: string
}

export const sections: Record<SectionKey, SectionColors> = {
  /** Liturgical events and programs: what the Parish Priest made. */
  liturgy: { cloth: '#8E3B4B', tint: '#F6EBED', border: 'rgba(142, 59, 75, 0.32)', ink: '#762E3D' },
  /** Rehearsals and attendance. */
  rehearsal: { cloth: '#2F6150', tint: '#E7F1EC', border: 'rgba(47, 97, 80, 0.32)', ink: '#24503F' },
  /** Practice assignments and submissions. */
  practice: { cloth: '#2E4D72', tint: '#E8EEF6', border: 'rgba(46, 77, 114, 0.3)', ink: '#24405F' },
  /** Service roster: tan leather bookcloth (owner choice 2026-10-28). */
  roster: { cloth: '#6B4A33', tint: '#F3ECE6', border: 'rgba(107, 74, 51, 0.3)', ink: '#5A3E2B' },
  /** Something waiting on the viewer. */
  attention: { cloth: '#A8741A', tint: '#FBF3E2', border: '#EBCF97', ink: '#7A4F0C' },
}

/** An event the Parish Priest made, on his calendar: a liturgy chip, apart from the synced liturgical days (grey). */
export const priestEvent = {
  background: sections.liturgy.tint,
  border: sections.liturgy.border,
  text: sections.liturgy.ink,
} as const

/**
 * The one motion moment (brief §12.9): the bookmark ribbon slides to the next preparation step after the Priest
 * approves. Everything else changes at once; with `prefers-reduced-motion: reduce` the slide is dropped too.
 */
export const motion = {
  bookmarkMs: 320,
  easeOut: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
} as const

export const shadows = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
} as const

/** Card look: flat white on the grey ground, one quiet 1px border, no shadow. The Card theme gives the radius. */
export const cardSurface = {
  border: '1px solid rgba(0, 0, 0, 0.07)',
  boxShadow: 'none',
  background: colors.surface,
} as const

/**
 * Be Vietnam Pro keeps Vietnamese diacritics clear at dashboard sizes (DESIGN(2).md §3).
 * Fonts are self-hosted via @fontsource (weights 400–700), imported in src/main.tsx. Dates, times and counts stay in
 * this face. It has no `tnum` feature, so `tabular-nums` does nothing; figures are proportional and line up by layout
 * (owner, 2026-10-31).
 */
export const typography = {
  fontFamily:
    "'Be Vietnam Pro', Manrope, 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  /**
   * Season and celebration titles only, 24px or larger (brief 2026-10-31). Cormorant Garamond 600 passed the Vietnamese
   * check ("Chúa Nhật Thứ Ba Mùa Vọng"); everything else stays in Be Vietnam Pro.
   */
  displayFontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  fontSize: 14,
  /** Generous line height for Vietnamese diacritics (DESIGN(2).md: 1.55–1.65). */
  lineHeight: 1.6,
  pageTitle: { fontSize: 24, lineHeight: 1.3, fontWeight: 600 },
  /** Title inside a standalone panel such as the sign-in card. */
  panelTitle: { fontSize: 24, lineHeight: 1.3 },
  sectionHeading: { fontSize: 18, lineHeight: 1.4 },
  cardHeading: { fontSize: 16, lineHeight: 1.4 },
  metadata: { fontSize: 12 },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

/** Tight corners, chosen once (2026-10-30): 4 for chips, 6 for controls, 8 for containers. */
export const radius = {
  sm: 4,
  /** Buttons, inputs, navigation rows. */
  md: 6,
  /** Containers: cards, modals, state panels, tables. */
  lg: 8,
} as const

export const sizes = {
  /** Buttons 40–44px, inputs 42–46px (DESIGN(2).md §5). */
  controlHeight: 40,
  /** Minimum touch target below the mobile breakpoint. */
  touchTarget: 44,
} as const

export const layout = {
  sidebarWidth: 256,
  headerHeight: 64,
  contentMaxWidth: 1360,
  contentPaddingX: 32,
  contentPaddingXMobile: 16,
} as const
