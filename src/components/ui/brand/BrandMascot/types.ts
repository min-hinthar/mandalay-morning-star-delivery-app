import type { Variants } from "framer-motion";

export type MascotExpression =
  | "happy"
  | "excited"
  | "thinking"
  | "celebrating"
  | "waving"
  | "sleeping"
  | "surprised"
  | "eating";

export type MascotSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface BrandMascotProps {
  /** Current expression */
  expression?: MascotExpression;
  /** Size variant */
  size?: MascotSize;
  /** Auto-cycle through expressions */
  autoCycle?: boolean;
  /** Cycle interval in ms */
  cycleInterval?: number;
  /** Enable idle animations (blink, bounce) */
  idleAnimations?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Trigger celebration animation */
  celebrate?: boolean;
  /** Additional className */
  className?: string;
  /** Accessible label */
  "aria-label"?: string;
}

export const sizeConfig: Record<MascotSize, { container: number; face: number; eyes: number; mouth: number }> = {
  xs: { container: 40, face: 32, eyes: 4, mouth: 8 },
  sm: { container: 60, face: 48, eyes: 6, mouth: 12 },
  md: { container: 100, face: 80, eyes: 10, mouth: 20 },
  lg: { container: 150, face: 120, eyes: 15, mouth: 30 },
  xl: { container: 200, face: 160, eyes: 20, mouth: 40 },
};

// Bound all mascot animations to 5 cycles to prevent mobile crashes
export const expressionVariants: Record<MascotExpression, Variants> = {
  happy: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: 5, ease: "easeInOut" },
    },
  },
  excited: {
    initial: { scale: 1, y: 0 },
    animate: {
      y: [0, -8, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, repeat: 5, ease: "easeOut" },
    },
  },
  thinking: {
    initial: { rotate: 0 },
    animate: {
      rotate: [-5, 5, -5],
      transition: { duration: 2, repeat: 5, ease: "easeInOut" },
    },
  },
  celebrating: {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.2, 0.9, 1.1, 1],
      rotate: [-10, 10, -10, 10, 0],
      transition: { duration: 1, repeat: 5 },
    },
  },
  waving: {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -5, 15, 0],
      transition: { duration: 1.5, repeat: 5, ease: "easeInOut" },
    },
  },
  sleeping: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.03, 1],
      transition: { duration: 3, repeat: 5, ease: "easeInOut" },
    },
  },
  surprised: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.15, 1.1],
      transition: { duration: 0.3, ease: "easeOut" },
    },
  },
  eating: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 0.95, 1.05, 1],
      transition: { duration: 0.8, repeat: 5 },
    },
  },
};
