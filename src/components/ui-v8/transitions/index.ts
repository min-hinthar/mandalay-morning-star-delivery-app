/**
 * V8 Transition Components
 *
 * Page and route transition components using Framer Motion.
 * Compatible with existing PageTransition API.
 *
 * @example
 * import { PageTransitionV8 } from "@/components/ui-v8/transitions";
 */

export {
  PageTransitionV8,
  type PageTransitionV8Props,
  type PageTransitionVariant,
} from "./PageTransitionV8";

// Re-export existing PageTransition for compatibility
export {
  PageTransition,
  type PageTransitionProps,
  FadeTransition,
  type FadeTransitionProps,
  SlideTransition,
  type SlideTransitionProps,
  ScaleTransition,
  type ScaleTransitionProps,
  MorphBlurTransition,
  type MorphBlurTransitionProps,
  StaggerChild,
  type StaggerChildProps,
} from "@/components/layouts/PageTransition";
