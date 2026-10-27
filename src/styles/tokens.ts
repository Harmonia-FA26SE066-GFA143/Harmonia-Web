/**
 * Harmonia design tokens.
 * Sources: .ai-skills/design/design-system.md (workspace root) for colors; Stitch DESIGN(2).md
 * (project 5445464059092912576) for typography, sizing and layout where design-system.md is silent.
 * Where the two disagree, design-system.md wins (see docs/stitch-screen-map.md, phase 0 notes).
 * Single source for colors and sizes; the Ant Design theme and custom styles both read from here.
 */
export const colors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  softSurface: '#F3F4F6',
  border: '#E5E7EB',
  mutedBorder: '#D1D5DB',
  textPrimary: '#111827',
  textBody: '#374151',
  textMuted: '#6B7280',
  /** Still 5.5:1 on the grey of a disabled control: a disabled button must be readable, only not clickable. */
  textDisabled: '#5F6368',
  primary: '#8E3B4B',
  primaryHover: '#762E3D',
  primarySoft: 'rgba(142, 59, 75, 0.08)',
  primaryFocus: 'rgba(142, 59, 75, 0.25)',
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
  /** Controls drawn on the media (pause button, pill). */
  controlFill: 'rgba(255, 255, 255, 0.14)',
  controlBorder: 'rgba(255, 255, 255, 0.4)',
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
 * this face with `fontVariantNumeric: 'tabular-nums'`, so their digits line up without a monospace face (#245).
 */
export const typography = {
  fontFamily:
    "'Be Vietnam Pro', Manrope, 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 14,
  /** Generous line height for Vietnamese diacritics (DESIGN(2).md: 1.55–1.65). */
  lineHeight: 1.6,
  pageTitle: { fontSize: 28, lineHeight: 1.25, fontWeight: 700 },
  /** Title inside a standalone panel such as the sign-in card. */
  panelTitle: { fontSize: 24, lineHeight: 1.3 },
  sectionHeading: { fontSize: 19, lineHeight: 1.4 },
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

export const radius = {
  sm: 6,
  /** Buttons and inputs (DESIGN(2).md: 8–10px). */
  md: 10,
  /** Containers: cards, modals, state panels. */
  lg: 14,
} as const

export const sizes = {
  /** Buttons 40–44px, inputs 42–46px (DESIGN(2).md §5). */
  controlHeight: 40,
  /** Minimum touch target below the mobile breakpoint. */
  touchTarget: 44,
} as const

export const layout = {
  sidebarWidth: 260,
  headerHeight: 64,
  contentMaxWidth: 1360,
  contentPaddingX: 32,
  contentPaddingXMobile: 16,
} as const
