import type { CheckoutStep } from "@/types/checkout";

/**
 * Direction-aware step transition variants with scale morph and glow
 * - Forward (1): current slides left, new slides from right
 * - Backward (-1): current slides right, new slides from left
 * - Scale morph gives premium feel to transitions
 * - Subtle glow enhances visual interest
 *
 * Note: boxShadow values are ~--shadow-glow-primary equivalent,
 * kept numeric for Framer Motion interpolation between states.
 */
export const stepVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    boxShadow: "0 0 30px rgba(164, 16, 52, 0.08)", // ~--shadow-glow-primary light
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.95,
    boxShadow: "0 0 0px rgba(164, 16, 52, 0)",
  }),
};

export const STEPS: CheckoutStep[] = ["address", "time", "payment"];
