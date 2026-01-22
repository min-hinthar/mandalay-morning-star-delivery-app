/**
 * Z-Index Layer System
 * TypeScript constants mirroring CSS custom properties in tokens.css
 *
 * Use zIndex.modal for inline styles
 * Use zIndexVar.modal for style objects needing CSS var syntax
 * Use z-modal class for TailwindCSS
 */

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 100,
} as const;

export type ZIndexToken = keyof typeof zIndex;
export type ZIndexValue = (typeof zIndex)[ZIndexToken];

/**
 * CSS variable references for style objects
 * @example style={{ zIndex: zIndexVar.modal }}
 */
export const zIndexVar = {
  base: "var(--z-base)",
  dropdown: "var(--z-dropdown)",
  sticky: "var(--z-sticky)",
  fixed: "var(--z-fixed)",
  modalBackdrop: "var(--z-modal-backdrop)",
  modal: "var(--z-modal)",
  popover: "var(--z-popover)",
  tooltip: "var(--z-tooltip)",
  toast: "var(--z-toast)",
  max: "var(--z-max)",
} as const;

/**
 * Tailwind class names for z-index utilities
 * @example className={zClass.modal}
 */
export const zClass = {
  base: "z-base",
  dropdown: "z-dropdown",
  sticky: "z-sticky",
  fixed: "z-fixed",
  modalBackdrop: "z-modal-backdrop",
  modal: "z-modal",
  popover: "z-popover",
  tooltip: "z-tooltip",
  toast: "z-toast",
  max: "z-max",
} as const;
