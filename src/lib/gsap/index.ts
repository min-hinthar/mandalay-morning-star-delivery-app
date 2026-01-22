/**
 * GSAP Plugin Registration
 * Single point of registration for all GSAP plugins
 *
 * IMPORTANT: Import from @/lib/gsap, not directly from gsap
 * This ensures plugins are registered before use
 *
 * @example
 * import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
 */
"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";

// Register all plugins ONCE at module load
// This prevents "Plugin not registered" errors in production
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);

// Global configuration for performance
gsap.config({
  autoSleep: 60, // Pause rendering when inactive for 60 frames
  force3D: true, // Use GPU acceleration where possible
  nullTargetWarn: false, // Suppress warnings for SSR (targets may not exist on server)
});

// Default animation settings matching motion-tokens feel
gsap.defaults({
  duration: 0.6, // Matches motion-tokens normal duration
  ease: "power2.out", // Smooth deceleration
});

// Re-export everything for single import point
export { gsap, useGSAP, ScrollTrigger, SplitText, Flip, Observer };

// Re-export commonly used types from gsap core
// Note: GSAPCallback, GSAPTweenVars are global ambient types, not module exports
// Use gsap.TweenVars, gsap.Callback etc. from the gsap namespace instead
