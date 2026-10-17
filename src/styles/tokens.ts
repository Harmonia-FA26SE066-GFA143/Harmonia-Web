/**
 * Harmonia design tokens.
 * Sources: .ai-skills/design/design-system.md (workspace root) for colors; Stitch DESIGN(2).md
 * (project 5445464059092912576) for typography, sizing and layout where design-system.md is silent.
 * Where the two disagree, design-system.md wins (see docs/design/stitch-screen-map.md, phase 0 notes).
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
  textDisabled: '#9CA3AF',
  primary: '#8E3B4B',
  primaryHover: '#762E3D',
  primarySoft: 'rgba(142, 59, 75, 0.08)',
  primaryFocus: 'rgba(142, 59, 75, 0.25)',
  primaryGlow: 'rgba(142, 59, 75, 0.15)',
  accentGold: '#B8860B',
  accentGoldSoft: 'rgba(184, 134, 11, 0.10)',
} as const

export const gradients = {
  primary: 'linear-gradient(135deg, #8E3B4B 0%, #A3485A 100%)',
  primaryHover: 'linear-gradient(135deg, #7A2E3D 0%, #8E3B4B 100%)',
  surfaceCard: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)',
  brandGlow: 'radial-gradient(ellipse at top, rgba(142, 59, 75, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
  heroBg: 'linear-gradient(180deg, #FFF9FA 0%, #F8F9FA 100%)',
} as const

export const shadows = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
  primary: '0 4px 14px 0 rgba(142, 59, 75, 0.25)',
  cardHover: '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
} as const

export const transitions = {
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  normal: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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
  xl: 20,
  full: 9999,
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
