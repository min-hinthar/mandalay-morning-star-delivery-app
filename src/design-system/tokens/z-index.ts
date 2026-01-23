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
 * These reference the --zindex-* custom properties defined in tokens.css
 * @example style={{ zIndex: zIndexVar.modal }} // outputs var(--zindex-modal)
 */
export const zIndexVar = {
  base: "var(--zindex-base)",
  dropdown: "var(--zindex-dropdown)",
  sticky: "var(--zindex-sticky)",
  fixed: "var(--zindex-fixed)",
  modalBackdrop: "var(--zindex-modal-backdrop)",
  modal: "var(--zindex-modal)",
  popover: "var(--zindex-popover)",
  tooltip: "var(--zindex-tooltip)",
  toast: "var(--zindex-toast)",
  max: "var(--zindex-max)",
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
