/**
 * Color Token System
 * Semantic color definitions with CSS variable pattern
 *
 * Use colors.backdrop for literal values (reference/documentation)
 * Use colorVar.backdrop for CSS var syntax in style objects
 *
 * @example
 * // In style objects
 * style={{ backgroundColor: colorVar.surfacePrimary }}
 *
 * // In className (use Tailwind equivalents)
 * className="bg-white dark:bg-zinc-900"
 */

/**
 * Color tokens - literal values for reference
 * These represent the actual color values used in the design system
 */
export const colors = {
  // ============================================
  // BACKDROP COLORS
  // ============================================

  /** Modal/overlay backdrop - semi-transparent dark */
  backdrop: "rgba(26, 26, 26, 0.5)",
  /** Backdrop for dark mode - deeper black */
  backdropDark: "rgba(0, 0, 0, 0.6)",

  // ============================================
  // SURFACE COLORS
  // ============================================

  /** Primary surface - white */
  surfacePrimary: "#ffffff",
  /** Primary surface dark mode */
  surfacePrimaryDark: "#1A1918",

  /** Secondary surface - subtle off-white */
  surfaceSecondary: "#f8f7f6",
  /** Secondary surface dark mode */
  surfaceSecondaryDark: "#2a2827",

  /** Tertiary surface - hover states */
  surfaceTertiary: "#f0eeec",
  /** Tertiary surface dark mode */
  surfaceTertiaryDark: "#3a3837",

  // ============================================
  // BORDER COLORS
  // ============================================

  /** Standard border */
  border: "#e5e5e5",
  /** Border dark mode */
  borderDark: "#3a3837",

  /** Subtle border - less prominent */
  borderSubtle: "#f0eeec",
  /** Subtle border dark mode */
  borderSubtleDark: "#2a2827",

  // ============================================
  // TEXT COLORS
  // ============================================

  /** Primary text - near black */
  textPrimary: "#1a1918",
  /** Primary text dark mode */
  textPrimaryDark: "#f8f7f6",

  /** Secondary text - muted */
  textSecondary: "#4a4845",
  /** Secondary text dark mode */
  textSecondaryDark: "#b5b3b0",

  /** Muted text - very subtle */
  textMuted: "#9ca3af",
  /** Muted text dark mode */
  textMutedDark: "#6b7280",

  // ============================================
  // INTERACTIVE COLORS
  // ============================================

  /** Primary interactive - gold accent */
  interactivePrimary: "#D4A853",
  /** Interactive hover state */
  interactiveHover: "#C49843",

  // ============================================
  // STATUS COLORS
  // ============================================

  /** Error/danger state */
  statusError: "#C45C4A",
  /** Success state */
  statusSuccess: "#22c55e",
  /** Warning state */
  statusWarning: "#f59e0b",
  /** Info state */
  statusInfo: "#3b82f6",
} as const;

export type ColorToken = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorToken];

/**
 * CSS variable references for style objects
 * These reference CSS custom properties defined in globals.css
 * @example style={{ backgroundColor: colorVar.surfacePrimary }}
 */
export const colorVar = {
  // ============================================
  // BACKDROP COLORS
  // ============================================

  backdrop: "var(--color-backdrop, rgba(26, 26, 26, 0.5))",
  backdropDark: "var(--color-backdrop-dark, rgba(0, 0, 0, 0.6))",

  // ============================================
  // SURFACE COLORS
  // ============================================

  surfacePrimary: "var(--color-surface, #fff)",
  surfacePrimaryDark: "var(--color-surface-primary-dark, #1A1918)",

  surfaceSecondary: "var(--color-surface-secondary, #f8f7f6)",
  surfaceSecondaryDark: "var(--color-surface-secondary-dark, #2a2827)",

  surfaceTertiary: "var(--color-surface-tertiary, #f0eeec)",
  surfaceTertiaryDark: "var(--color-surface-tertiary-dark, #3a3837)",

  // ============================================
  // BORDER COLORS
  // ============================================

  border: "var(--color-border, #e5e5e5)",
  borderDark: "var(--color-border-dark, #3a3837)",

  borderSubtle: "var(--color-border-subtle, #f0eeec)",
  borderSubtleDark: "var(--color-border-subtle-dark, #2a2827)",

  // ============================================
  // TEXT COLORS
  // ============================================

  textPrimary: "var(--color-text-primary, #1a1918)",
  textPrimaryDark: "var(--color-text-primary-dark, #f8f7f6)",

  textSecondary: "var(--color-text-secondary, #4a4845)",
  textSecondaryDark: "var(--color-text-secondary-dark, #b5b3b0)",

  textMuted: "var(--color-text-muted, #9ca3af)",
  textMutedDark: "var(--color-text-muted-dark, #6b7280)",

  // ============================================
  // INTERACTIVE COLORS
  // ============================================

  interactivePrimary: "var(--color-interactive-primary, #D4A853)",
  interactiveHover: "var(--color-interactive-hover, #C49843)",

  // ============================================
  // STATUS COLORS
  // ============================================

  statusError: "var(--color-status-error, #C45C4A)",
  statusSuccess: "var(--color-status-success, #22c55e)",
  statusWarning: "var(--color-status-warning, #f59e0b)",
  statusInfo: "var(--color-status-info, #3b82f6)",
} as const;

export type ColorVarToken = keyof typeof colorVar;
