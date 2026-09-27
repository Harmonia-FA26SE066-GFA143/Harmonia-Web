import type { ThemeConfig } from 'antd'
import { colors, layout, radius, sizes, spacing, typography } from '@/styles/tokens'

/**
 * Maps Harmonia design tokens onto Ant Design theme tokens.
 * Semantic colors (success/warning/error/info) keep Ant Design defaults: no approved values exist yet.
 */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorLink: colors.primary,
    colorBgLayout: colors.background,
    colorBgContainer: colors.surface,
    colorFillAlter: colors.softSurface,
    colorBorder: colors.mutedBorder,
    colorBorderSecondary: colors.border,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textBody,
    colorTextTertiary: colors.textMuted,
    colorTextDisabled: colors.textDisabled,
    controlOutline: colors.primaryFocus,
    controlItemBgActive: colors.primarySoft,

    fontFamily: typography.fontFamily,
    fontFamilyCode: typography.fontFamilyNumeric,
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    fontSizeHeading1: typography.pageTitle.fontSize,
    lineHeightHeading1: typography.pageTitle.lineHeight,
    fontSizeHeading2: typography.sectionHeading.fontSize,
    lineHeightHeading2: typography.sectionHeading.lineHeight,
    fontSizeHeading3: typography.cardHeading.fontSize,
    lineHeightHeading3: typography.cardHeading.lineHeight,

    borderRadius: radius.md,
    borderRadiusSM: radius.sm,
    borderRadiusLG: radius.lg,
    controlHeight: sizes.controlHeight,
    // Cards/containers are separated by borders and whitespace, not elevation (design-system.md).
    boxShadowTertiary: 'none',
  },
  components: {
    Layout: {
      bodyBg: colors.background,
      headerBg: colors.surface,
      headerHeight: layout.headerHeight,
      headerPadding: `0 ${layout.contentPaddingX}px`,
      siderBg: colors.surface,
    },
    Menu: {
      itemSelectedBg: colors.primarySoft,
      itemSelectedColor: colors.primary,
      itemHeight: sizes.controlHeight,
      itemBorderRadius: radius.md,
      groupTitleColor: colors.textMuted,
      groupTitleFontSize: typography.metadata.fontSize,
      activeBarBorderWidth: 0,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Table: {
      headerBg: colors.background,
      cellPaddingBlock: spacing.md,
    },
    Breadcrumb: {
      fontSize: typography.metadata.fontSize,
    },
  },
}
