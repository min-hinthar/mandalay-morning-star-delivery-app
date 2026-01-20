"use client";

/**
 * V7 Fallback Wrapper - Graceful Degradation Component
 *
 * Sprint 11: Feature Flags & Rollout
 * Wraps V7 components with automatic fallback to V6
 *
 * Features:
 * - Feature flag integration
 * - Error boundary with fallback
 * - Performance monitoring
 * - Automatic Sentry reporting
 *
 * @example
 * <V7FallbackWrapper
 *   flag="v7_hero"
 *   v7Component={<HeroV7 />}
 *   v6Fallback={<HeroV6 />}
 * />
 */

import React, { Component, ErrorInfo, Suspense, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import type { FeatureFlagName } from "@/lib/feature-flags";

// ============================================
// TYPES
// ============================================

interface V7FallbackWrapperProps {
  /** Feature flag to check */
  flag: FeatureFlagName;
  /** V7 component to render when flag is enabled */
  v7Component: React.ReactNode;
  /** V6/fallback component when flag is disabled or error occurs */
  v6Fallback: React.ReactNode;
  /** Loading component while checking flags */
  loadingComponent?: React.ReactNode;
  /** Component name for error reporting */
  componentName?: string;
  /** Track performance metrics */
  trackPerformance?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================
// ERROR BOUNDARY
// ============================================

class V7ErrorBoundary extends Component<
  {
    children: React.ReactNode;
    fallback: React.ReactNode;
    componentName?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    fallback: React.ReactNode;
    componentName?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName, onError } = this.props;

    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setTag("v7_component", componentName || "unknown");
      scope.setTag("error_type", "v7_render_error");
      scope.setExtra("componentStack", errorInfo.componentStack);
      Sentry.captureException(error);
    });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[V7 Error] Component "${componentName}" failed:`,
        error,
        errorInfo
      );
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// ============================================
// PERFORMANCE TRACKER
// ============================================

function PerformanceTracker({
  componentName,
  children,
}: {
  componentName: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;

      // Report to Sentry as custom metric
      Sentry.addBreadcrumb({
        category: "performance",
        message: `V7 Component "${componentName}" rendered`,
        level: "info",
        data: {
          duration: `${duration.toFixed(2)}ms`,
          componentName,
        },
      });

      // Track long render times
      if (duration > 100) {
        Sentry.withScope((scope) => {
          scope.setTag("performance_issue", "slow_render");
          scope.setTag("v7_component", componentName);
          Sentry.captureMessage(`Slow V7 render: ${componentName}`, "warning");
        });
      }
    };
  }, [componentName]);

  return <>{children}</>;
}

// ============================================
// LOADING SKELETON
// ============================================

function DefaultLoadingSkeleton() {
  return (
    <div className="animate-pulse bg-v6-surface-secondary rounded-lg h-32 w-full" />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function V7FallbackWrapper({
  flag,
  v7Component,
  v6Fallback,
  loadingComponent,
  componentName = flag,
  trackPerformance = true,
}: V7FallbackWrapperProps) {
  const isV7Enabled = useFeatureFlag(flag);

  // Track flag evaluation
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "feature_flag",
      message: `Flag "${flag}" evaluated: ${isV7Enabled}`,
      level: "info",
      data: { flag, enabled: isV7Enabled, componentName },
    });
  }, [flag, isV7Enabled, componentName]);

  // If V7 is not enabled, show V6 fallback
  if (!isV7Enabled) {
    return <>{v6Fallback}</>;
  }

  // Wrap V7 component with error boundary and suspense
  const v7WithProtection = (
    <V7ErrorBoundary fallback={v6Fallback} componentName={componentName}>
      <Suspense fallback={loadingComponent || <DefaultLoadingSkeleton />}>
        {trackPerformance ? (
          <PerformanceTracker componentName={componentName}>
            {v7Component}
          </PerformanceTracker>
        ) : (
          v7Component
        )}
      </Suspense>
    </V7ErrorBoundary>
  );

  return v7WithProtection;
}

// ============================================
// HOOK VERSION
// ============================================

/**
 * Hook version for more control
 *
 * @example
 * const { shouldRenderV7, renderWithFallback } = useV7Fallback('v7_hero');
 *
 * if (shouldRenderV7) {
 *   return renderWithFallback(<HeroV7 />, <HeroV6 />);
 * }
 * return <HeroV6 />;
 */
export function useV7Fallback(flag: FeatureFlagName) {
  const isV7Enabled = useFeatureFlag(flag);

  const renderWithFallback = React.useCallback(
    (v7Component: React.ReactNode, v6Fallback: React.ReactNode) => {
      if (!isV7Enabled) {
        return <>{v6Fallback}</>;
      }

      return (
        <V7ErrorBoundary fallback={v6Fallback} componentName={flag}>
          {v7Component}
        </V7ErrorBoundary>
      );
    },
    [isV7Enabled, flag]
  );

  return {
    shouldRenderV7: isV7Enabled,
    renderWithFallback,
  };
}

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * Pre-configured wrappers for common V7 components
 */

export function V7HeroWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_hero"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Hero"
    />
  );
}

export function V7MenuWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_menu"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Menu"
    />
  );
}

export function V7CartWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_cart"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Cart"
    />
  );
}

export function V7CheckoutWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_checkout"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Checkout"
    />
  );
}

export function V7TrackingWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_tracking"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Tracking"
    />
  );
}

export function V7AuthWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_auth"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Auth"
    />
  );
}

export function V7OnboardingWrapper({
  v7,
  v6,
}: {
  v7: React.ReactNode;
  v6: React.ReactNode;
}) {
  return (
    <V7FallbackWrapper
      flag="v7_onboarding"
      v7Component={v7}
      v6Fallback={v6}
      componentName="Onboarding"
    />
  );
}

export default V7FallbackWrapper;
