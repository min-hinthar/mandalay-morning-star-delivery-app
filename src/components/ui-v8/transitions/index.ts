/**
 * V8 Transition Components (Re-exports)
 *
 * @deprecated Import from "@/components/ui/transitions" instead.
 */

// Re-export from new location for backwards compatibility
export {
  PageTransition,
  PageTransition as PageTransitionV8,
  type PageTransitionProps,
  type PageTransitionProps as PageTransitionV8Props,
  type PageTransitionVariant,
} from "@/components/ui/transitions";

// Re-export existing PageTransition variants for compatibility
export {
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
