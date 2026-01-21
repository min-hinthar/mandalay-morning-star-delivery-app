/**
 * Layout Utilities Index
 * Page transitions, parallax effects, stagger animations
 */

// ============================================
// PAGE TRANSITION
// Multiple variants: fade, slide, scale, reveal, flip, morphBlur
// ============================================
export {
  PageTransition,
  PageTransition as PageTransitionV7,
  FadeTransition,
  FadeTransition as FadeTransitionV7,
  SlideTransition,
  SlideTransition as SlideTransitionV7,
  ScaleTransition,
  ScaleTransition as ScaleTransitionV7,
  MorphBlurTransition,
  MorphBlurTransition as MorphBlurTransitionV7,
  StaggerChild,
  type PageTransitionProps,
  type PageTransitionProps as PageTransitionV7Props,
  type PageTransitionVariant,
  type FadeTransitionProps,
  type FadeTransitionProps as FadeTransitionV7Props,
  type SlideTransitionProps,
  type SlideTransitionProps as SlideTransitionV7Props,
  type ScaleTransitionProps,
  type ScaleTransitionProps as ScaleTransitionV7Props,
  type MorphBlurTransitionProps,
  type MorphBlurTransitionProps as MorphBlurTransitionV7Props,
  type SlideDirection,
  type StaggerChildProps,
} from "./PageTransition";

// ============================================
// PARALLAX CONTAINER
// Multi-layer parallax with scroll-based transforms
// ============================================
export {
  ParallaxContainer,
  ParallaxLayer,
  ParallaxImage,
  ParallaxText,
  ParallaxGradient,
  SimpleParallax,
  ScrollOpacity,
  ScrollScale,
  type ParallaxContainerProps,
  type ParallaxLayerProps,
  type ParallaxImageProps,
  type ParallaxTextProps,
  type ParallaxGradientProps,
  type SimpleParallaxProps,
  type ScrollOpacityProps,
  type ScrollScaleProps,
  type ParallaxSpeed,
} from "./ParallaxContainer";
