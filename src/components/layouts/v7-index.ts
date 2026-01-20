/**
 * V7 Layout Utilities Index
 * Page transitions, parallax effects, stagger animations
 *
 * @example
 * import {
 *   PageTransitionV7,
 *   ParallaxContainer,
 *   ParallaxLayer,
 *   SimpleParallax,
 * } from '@/components/layouts/v7-index';
 */

// ============================================
// PAGE TRANSITION V7
// Multiple variants: fade, slide, scale, reveal, flip, morphBlur
// ============================================
export {
  PageTransitionV7,
  FadeTransitionV7,
  SlideTransitionV7,
  ScaleTransitionV7,
  MorphBlurTransitionV7,
  StaggerChild,
  type PageTransitionV7Props,
  type PageTransitionVariant,
  type FadeTransitionV7Props,
  type SlideTransitionV7Props,
  type ScaleTransitionV7Props,
  type MorphBlurTransitionV7Props,
  type SlideDirection,
  type StaggerChildProps,
} from "./PageTransitionV7";

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
