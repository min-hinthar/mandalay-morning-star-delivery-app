"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useReducedMotion as useFramerReducedMotion } from "framer-motion";
import { useDeviceCapability, type DeviceTier } from "@/lib/hooks/useDeviceCapability";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * Animation context value
 * Combines device capability, user preference, and system reduced motion
 */
interface AnimationContextValue {
  /** Device capability tier (low/high) */
  tier: DeviceTier;
  /** User prefers reduced motion (OS setting) */
  systemReducedMotion: boolean | null;
  /** User has set animation preference to reduced/none */
  userReducedMotion: boolean;
  /** Combined: should we reduce animations? */
  reducedMotion: boolean;
  /** Should animations run at all? */
  shouldAnimate: boolean;
  /** Check if specific animation type is enabled */
  isEnabled: (type: "parallax" | "stagger" | "float" | "all") => boolean;
  /** Is parallax specifically enabled? (disabled on low-power and reduced-motion) */
  isParallaxEnabled: boolean;
  /** Has device capability been detected? */
  isDetected: boolean;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

/**
 * Animation Provider
 * Wraps app to provide animation context based on:
 * - Device hardware capability
 * - User animation preference
 * - System prefers-reduced-motion
 *
 * Per CONTEXT.md:
 * - Low-power disables: parallax only
 * - prefers-reduced-motion disables same set as low-power (parallax only)
 * - All other animations remain enabled
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  const { tier, isDetected } = useDeviceCapability();
  const { shouldAnimate: userShouldAnimate, isReduced: userReducedMotion } =
    useAnimationPreference();
  const systemReducedMotion = useFramerReducedMotion();

  const value = useMemo((): AnimationContextValue => {
    // Combined reduced motion: user preference OR system preference
    const reducedMotion = userReducedMotion || systemReducedMotion === true;

    // Should animate: user hasn't disabled animations
    const shouldAnimate = userShouldAnimate;

    // Parallax disabled on: low-power devices OR reduced motion preference
    const isParallaxEnabled = tier === "high" && !reducedMotion && shouldAnimate;

    return {
      tier,
      systemReducedMotion,
      userReducedMotion,
      reducedMotion,
      shouldAnimate,
      isParallaxEnabled,
      isDetected,
      isEnabled: (type) => {
        if (!shouldAnimate) return false;

        switch (type) {
          case "parallax":
            // Parallax disabled on low-power or reduced motion
            return isParallaxEnabled;
          case "stagger":
          case "float":
          case "all":
          default:
            // All other animations enabled regardless of tier
            return true;
        }
      },
    };
  }, [tier, isDetected, userShouldAnimate, userReducedMotion, systemReducedMotion]);

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

/**
 * Hook to access animation context
 * @throws Error if used outside AnimationProvider
 */
export function useAnimationContext(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimationContext must be used within AnimationProvider");
  }
  return context;
}

/**
 * Hook for optional animation context (returns defaults if no provider)
 * Use in shared components that might be rendered outside provider
 */
export function useAnimationContextSafe(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (!context) {
    // Return safe defaults
    return {
      tier: "high",
      systemReducedMotion: null,
      userReducedMotion: false,
      reducedMotion: false,
      shouldAnimate: true,
      isParallaxEnabled: true,
      isDetected: false,
      isEnabled: () => true,
    };
  }
  return context;
}
