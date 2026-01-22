/**
 * Motion Token System
 * Overlay-specific spring physics and timing configurations
 *
 * Use overlayMotion.modalOpen for Framer Motion spring configs
 * Use overlayCSSVars for CSS custom property references
 *
 * @example
 * <motion.div
 *   initial={{ opacity: 0, scale: 0.95 }}
 *   animate={{ opacity: 1, scale: 1 }}
 *   transition={overlayMotion.modalOpen}
 * />
 */

/**
 * Overlay animation configurations for Framer Motion
 * Spring configs for bouncy, natural feel; duration configs for quick transitions
 */
export const overlayMotion = {
  /** Modal/dialog open spring - bouncy entrance */
  modalOpen: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
  },
  /** Modal close - faster, no bounce */
  modalClose: {
    duration: 0.2,
    ease: "easeIn" as const,
  },
  /** Bottom sheet slide up - slightly more damped */
  sheetOpen: {
    type: "spring" as const,
    damping: 30,
    stiffness: 300,
  },
  /** Drawer slide in - same as modal */
  drawerOpen: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
  },
  /** Backdrop fade - quick and simple */
  backdrop: {
    duration: 0.2,
    ease: "easeOut" as const,
  },
  /** Dropdown scale+fade - snappy spring */
  dropdown: {
    type: "spring" as const,
    damping: 20,
    stiffness: 400,
  },
  /** Tooltip fast appear */
  tooltip: {
    duration: 0.15,
    ease: "easeOut" as const,
  },
  /** Toast slide in */
  toast: {
    type: "spring" as const,
    damping: 20,
    stiffness: 300,
  },
} as const;

export type OverlayMotionToken = keyof typeof overlayMotion;

/**
 * CSS variable references for overlay styling
 * Backdrop blur and colors with dark mode awareness
 */
export const overlayCSSVars = {
  /** Standard backdrop blur value */
  backdropBlur: "var(--blur-md, 8px)",
  /** Backdrop color (light mode) - semi-transparent dark */
  backdropColor: "rgba(26, 26, 26, 0.5)",
  /** Backdrop color (dark mode) - deeper black */
  backdropColorDark: "rgba(0, 0, 0, 0.6)",
} as const;

export type OverlayCSSVarToken = keyof typeof overlayCSSVars;
