/**
 * Harmonia design tokens.
 * Sources: .ai-skills/design/design-system.md (workspace root) for colors; Stitch DESIGN(2).md
 * (project 5445464059092912576) for typography, sizing and layout where design-system.md is silent.
 * Where the two disagree, design-system.md wins (see docs/design/stitch-screen-map.md, phase 0 notes).
 * Single source for colors and sizes; the Ant Design theme and custom styles both read from here.
 */
export const colors = {
  background: '#F7F7F8',
  surface: '#FFFFFF',
  softSurface: '#F1F1F3',
  border: '#E4E4E7',
  mutedBorder: '#D4D4D8',
  textPrimary: '#18181B',
  textBody: '#3F3F46',
  textMuted: '#71717A',
  textDisabled: '#A1A1AA',
  primary: '#8E3B4B',
  primarySoft: 'rgba(142, 59, 75, 0.10)',
  primaryFocus: 'rgba(142, 59, 75, 0.30)',
} as const

/**
 * Be Vietnam Pro keeps Vietnamese diacritics clear at dashboard sizes (DESIGN(2).md §3).
 * Fonts are self-hosted via @fontsource (weights 400–700, JetBrains Mono 400), imported in src/main.tsx.
 */
export const typography = {
  fontFamily:
    "'Be Vietnam Pro', Manrope, 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  /** Dense numeric metadata (dates, codes) only; use sparingly. */
  fontFamilyNumeric: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 14,
  /** Generous line height for Vietnamese diacritics (DESIGN(2).md: 1.55–1.65). */
  lineHeight: 1.6,
  pageTitle: { fontSize: 30, lineHeight: 1.2, fontWeight: 700 },
  /** Title inside a standalone panel such as the sign-in card. */
  panelTitle: { fontSize: 24, lineHeight: 1.3 },
  sectionHeading: { fontSize: 20, lineHeight: 1.4 },
  cardHeading: { fontSize: 17, lineHeight: 1.4 },
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
  sm: 4,
  /** Buttons and inputs (DESIGN(2).md: 8–10px). */
  md: 8,
  /** Containers: cards, modals, state panels. */
  lg: 10,
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
