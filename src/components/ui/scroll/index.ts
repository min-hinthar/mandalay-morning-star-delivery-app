/**
 * Scroll Components
 *
 * Scroll animation and navigation components.
 * - GSAP-powered: ScrollChoreographer, RevealOnScroll, ParallaxLayer
 * - Framer Motion: AnimatedSection, SectionNavDots
 *
 * @example
 * import { ScrollChoreographer, AnimatedSection, itemVariants } from "@/components/ui/scroll";
 */

// GSAP-powered components
export {
  ScrollChoreographer,
  type ScrollChoreographerProps,
} from "./ScrollChoreographer";

export {
  RevealOnScroll,
  type RevealOnScrollProps,
  type RevealDirection,
} from "./RevealOnScroll";

export {
  ParallaxLayer,
  type ParallaxLayerProps,
  type ParallaxDirection,
} from "./ParallaxLayer";

// Framer Motion components
export { AnimatedSection, itemVariants } from "./AnimatedSection";
export { SectionNavDots } from "./SectionNavDots";
