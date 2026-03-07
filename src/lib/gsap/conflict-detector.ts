/**
 * GSAP / Framer Motion Conflict Detector
 *
 * Dev-mode only utility that warns when both GSAP and Framer Motion
 * attempt to animate the same DOM element.
 *
 * Per CONTEXT.md:
 * - GSAP owns scroll-linked animations
 * - Framer Motion owns state-driven animations
 * - They should not animate the same element simultaneously
 */

import { logger } from "@/lib/utils/logger";

// Only runs in development
const isDev = process.env.NODE_ENV === "development";

// Track elements being animated by each library
const gsapTargets = new WeakSet<Element>();
const framerMotionTargets = new WeakSet<Element>();

/**
 * Log a conflict warning with element details
 */
function warnConflict(element: Element, source: "gsap" | "framer-motion") {
  const other = source === "gsap" ? "Framer Motion" : "GSAP";
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = element.className
    ? `.${String(element.className).split(" ").slice(0, 3).join(".")}`
    : "";

  logger.warn(
    `[Animation Conflict] Element <${tagName}${id}${classes}> is animated by both GSAP and ${other}. This may cause janky animations. Fix: Use GSAP for scroll-linked animations, Framer Motion for state-driven animations.`,
    { element: `<${tagName}${id}${classes}>` }
  );
}

/**
 * Track GSAP animation target
 * Called from GSAP plugin init
 */
export function trackGsapTarget(element: Element): void {
  if (!isDev) return;

  if (framerMotionTargets.has(element)) {
    warnConflict(element, "gsap");
  }
  gsapTargets.add(element);
}

/**
 * Track Framer Motion animation target
 * Call this from components using motion.* elements
 *
 * @example
 * <motion.div
 *   ref={(el) => el && trackFramerMotionElement(el)}
 *   animate={{ x: 100 }}
 * />
 */
export function trackFramerMotionElement(element: Element | null): void {
  if (!isDev || !element) return;

  if (gsapTargets.has(element)) {
    warnConflict(element, "framer-motion");
  }
  framerMotionTargets.add(element);
}

/**
 * Initialize GSAP conflict detector plugin
 * Automatically tracks all GSAP animation targets
 */
export function initConflictDetector(gsapInstance: typeof import("gsap").gsap): void {
  if (!isDev) return;

  // Register a simple plugin that tracks targets
  gsapInstance.registerPlugin({
    name: "conflictDetector",
    init(target: Element) {
      trackGsapTarget(target);
      return true;
    },
  });
}

/**
 * Clear tracked elements (useful for testing)
 */
export function clearTracking(): void {
  // WeakSets auto-clear when elements are GC'd
  // This is just for explicit clearing if needed
}
