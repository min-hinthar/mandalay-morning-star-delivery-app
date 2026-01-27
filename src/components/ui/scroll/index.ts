/**
 * Scroll Components
 *
 * GSAP-powered scroll animation components using ScrollTrigger.
 * Import from @/lib/gsap is enforced for proper plugin registration.
 *
 * @example
 * import { ScrollChoreographer, RevealOnScroll, ParallaxLayer } from "@/components/ui/scroll";
 */

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
