"use client";

/**
 * V7 Feature Flag React Hook
 *
 * Sprint 11: Feature Flags & Rollout
 * Client-side feature flag evaluation with context provider
 *
 * @example
 * // In layout or root
 * <FeatureFlagProvider userId={user?.id} userEmail={user?.email}>
 *   <App />
 * </FeatureFlagProvider>
 *
 * // In components
 * const isV7Enabled = useFeatureFlag('v7_ui');
 * const { isEnabled, isLoading } = useFeatureFlagWithLoading('v7_hero');
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  FeatureFlagName,
  FeatureFlagContext,
  evaluateWithOverrides,
  getEnabledFlags,
  getFlagStateForAnalytics,
  getExposureEvent,
} from "@/lib/feature-flags";

// ============================================
// TYPES
// ============================================

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  userId?: string;
  userEmail?: string;
  isInternalUser?: boolean;
  isBetaUser?: boolean;
  userSegment?: string;
  /** Override flags for testing */
  overrides?: Partial<Record<FeatureFlagName, boolean>>;
}

interface FeatureFlagContextValue {
  context: FeatureFlagContext;
  isEnabled: (flagName: FeatureFlagName) => boolean;
  getEnabledFlags: () => FeatureFlagName[];
  trackExposure: (flagName: FeatureFlagName) => void;
  isLoaded: boolean;
}

// ============================================
// CONTEXT
// ============================================

const FeatureFlagReactContext = createContext<FeatureFlagContextValue | null>(
  null
);

// ============================================
// PROVIDER
// ============================================

export function FeatureFlagProvider({
  children,
  userId,
  userEmail,
  isInternalUser,
  isBetaUser,
  userSegment,
  overrides,
}: FeatureFlagProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate session ID on mount
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem("ff_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("ff_session_id", newSessionId);
      setSessionId(newSessionId);
    }
    setIsLoaded(true);
  }, []);

  // Build context
  const context: FeatureFlagContext = useMemo(
    () => ({
      userId,
      userEmail,
      isInternalUser,
      isBetaUser,
      userSegment,
      sessionId: sessionId || undefined,
      deviceType:
        typeof window !== "undefined"
          ? window.innerWidth < 768
            ? "mobile"
            : window.innerWidth < 1024
              ? "tablet"
              : "desktop"
          : undefined,
    }),
    [userId, userEmail, isInternalUser, isBetaUser, userSegment, sessionId]
  );

  // Check if flag is enabled
  const isEnabled = useCallback(
    (flagName: FeatureFlagName): boolean => {
      // Check overrides first
      if (overrides && flagName in overrides) {
        return overrides[flagName]!;
      }

      return evaluateWithOverrides(flagName, context);
    },
    [context, overrides]
  );

  // Get all enabled flags
  const getEnabled = useCallback((): FeatureFlagName[] => {
    const flags = getEnabledFlags(context);

    // Apply overrides
    if (overrides) {
      const result = new Set(flags);
      for (const [flag, enabled] of Object.entries(overrides)) {
        if (enabled) {
          result.add(flag as FeatureFlagName);
        } else {
          result.delete(flag as FeatureFlagName);
        }
      }
      return Array.from(result);
    }

    return flags;
  }, [context, overrides]);

  // Track exposure for A/B testing
  const trackExposure = useCallback(
    (flagName: FeatureFlagName) => {
      const event = getExposureEvent(flagName, context);

      // Send to analytics (integrate with your analytics provider)
      if (typeof window !== "undefined") {
        // Example: Send to custom analytics endpoint
        // fetch('/api/analytics/exposure', {
        //   method: 'POST',
        //   body: JSON.stringify(event),
        // });

        // Example: Send to window.analytics (Segment, etc.)
        // (window as any).analytics?.track('Feature Flag Exposure', event);

        // For now, just log in development
        if (process.env.NODE_ENV === "development") {
          console.log("[Feature Flag Exposure]", event);
        }
      }
    },
    [context]
  );

  const value: FeatureFlagContextValue = useMemo(
    () => ({
      context,
      isEnabled,
      getEnabledFlags: getEnabled,
      trackExposure,
      isLoaded,
    }),
    [context, isEnabled, getEnabled, trackExposure, isLoaded]
  );

  return (
    <FeatureFlagReactContext.Provider value={value}>
      {children}
    </FeatureFlagReactContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Use feature flag context
 */
export function useFeatureFlagContext(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagReactContext);

  if (!context) {
    throw new Error(
      "useFeatureFlagContext must be used within a FeatureFlagProvider"
    );
  }

  return context;
}

/**
 * Check if a feature flag is enabled
 *
 * @example
 * const isV7Enabled = useFeatureFlag('v7_ui');
 * if (isV7Enabled) {
 *   return <HeroV7 />;
 * }
 * return <HeroV6 />;
 */
export function useFeatureFlag(flagName: FeatureFlagName): boolean {
  const { isEnabled, trackExposure, isLoaded } = useFeatureFlagContext();

  const enabled = isEnabled(flagName);

  // Track exposure on mount
  useEffect(() => {
    if (isLoaded) {
      trackExposure(flagName);
    }
  }, [flagName, isLoaded, trackExposure]);

  return enabled;
}

/**
 * Check feature flag with loading state
 *
 * @example
 * const { isEnabled, isLoading } = useFeatureFlagWithLoading('v7_hero');
 * if (isLoading) return <Skeleton />;
 * return isEnabled ? <HeroV7 /> : <HeroV6 />;
 */
export function useFeatureFlagWithLoading(flagName: FeatureFlagName): {
  isEnabled: boolean;
  isLoading: boolean;
} {
  const { isEnabled, isLoaded, trackExposure } = useFeatureFlagContext();

  const enabled = isEnabled(flagName);

  // Track exposure when loaded
  useEffect(() => {
    if (isLoaded) {
      trackExposure(flagName);
    }
  }, [flagName, isLoaded, trackExposure]);

  return {
    isEnabled: enabled,
    isLoading: !isLoaded,
  };
}

/**
 * Get all enabled feature flags
 *
 * @example
 * const enabledFlags = useEnabledFlags();
 * console.log(enabledFlags); // ['v7_ui', 'v7_animations', ...]
 */
export function useEnabledFlags(): FeatureFlagName[] {
  const { getEnabledFlags } = useFeatureFlagContext();
  return getEnabledFlags();
}

/**
 * Get flag state for analytics
 *
 * @example
 * const flagState = useFeatureFlagState();
 * analytics.identify({ featureFlags: flagState });
 */
export function useFeatureFlagState(): Record<string, boolean> {
  const { context, isLoaded } = useFeatureFlagContext();

  return useMemo(() => {
    if (!isLoaded) return {};
    return getFlagStateForAnalytics(context);
  }, [context, isLoaded]);
}

// ============================================
// COMPONENTS
// ============================================

interface FeatureFlagGateProps {
  flag: FeatureFlagName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Show fallback while loading */
  loadingFallback?: React.ReactNode;
}

/**
 * Conditionally render based on feature flag
 *
 * @example
 * <FeatureFlagGate flag="v7_hero" fallback={<HeroV6 />}>
 *   <HeroV7 />
 * </FeatureFlagGate>
 */
export function FeatureFlagGate({
  flag,
  children,
  fallback = null,
  loadingFallback,
}: FeatureFlagGateProps) {
  const { isEnabled, isLoading } = useFeatureFlagWithLoading(flag);

  if (isLoading && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  return <>{isEnabled ? children : fallback}</>;
}

interface MultiFeatureFlagGateProps {
  flags: FeatureFlagName[];
  /** Require all flags (AND) or any flag (OR) */
  mode?: "all" | "any";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally render based on multiple feature flags
 *
 * @example
 * <MultiFeatureFlagGate flags={['v7_ui', 'v7_animations']} mode="all">
 *   <AnimatedComponent />
 * </MultiFeatureFlagGate>
 */
export function MultiFeatureFlagGate({
  flags,
  mode = "all",
  children,
  fallback = null,
}: MultiFeatureFlagGateProps) {
  const { isEnabled } = useFeatureFlagContext();

  const shouldRender =
    mode === "all"
      ? flags.every((flag) => isEnabled(flag))
      : flags.some((flag) => isEnabled(flag));

  return <>{shouldRender ? children : fallback}</>;
}
