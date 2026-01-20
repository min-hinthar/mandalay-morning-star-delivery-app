"use client";

/**
 * V7 A/B Testing React Hook
 *
 * Sprint 11: Feature Flags & Rollout
 * React hooks for experiment variant assignment
 *
 * @example
 * const { variant, isControl } = useExperiment('v7_hero_style');
 *
 * switch (variant) {
 *   case 'parallax_light': return <HeroParallaxLight />;
 *   case 'parallax_full': return <HeroParallaxFull />;
 *   case 'cinematic': return <HeroCinematic />;
 *   default: return <HeroControl />;
 * }
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  VariantName,
  ExperimentConfig,
  getVariantWithOverride,
  trackExposure,
  trackConversion,
  trackMetric,
  getExperiment,
  isExperimentActive,
  getActiveExperiments,
  getAllAssignments,
  ExperimentAssignment,
} from "@/lib/ab-testing";
import { useFeatureFlagContext } from "@/lib/hooks/useFeatureFlag";

// ============================================
// TYPES
// ============================================

interface UseExperimentResult {
  /** Assigned variant */
  variant: VariantName | null;
  /** Whether user is in control group */
  isControl: boolean;
  /** Whether experiment is active */
  isActive: boolean;
  /** Track a conversion event */
  trackConversion: (conversionName: string, value?: number) => void;
  /** Track a custom metric */
  trackMetric: (metricName: string, value: number) => void;
  /** Experiment config */
  experiment: ExperimentConfig | null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Get experiment variant and tracking functions
 *
 * @example
 * const { variant, isControl, trackConversion } = useExperiment('v7_checkout_style');
 *
 * // Track purchase conversion
 * const handlePurchase = () => {
 *   trackConversion('purchase', orderTotal);
 *   // ... process purchase
 * };
 */
export function useExperiment(experimentName: string): UseExperimentResult {
  const { context } = useFeatureFlagContext();
  const userId = context.userId || context.sessionId || "anonymous";

  const [hasTrackedExposure, setHasTrackedExposure] = useState(false);

  // Get experiment config
  const experiment = useMemo(
    () => getExperiment(experimentName),
    [experimentName]
  );

  // Get variant assignment
  const variant = useMemo(
    () => getVariantWithOverride(experimentName, userId),
    [experimentName, userId]
  );

  // Check if control
  const isControl = useMemo(() => {
    if (!experiment || !variant) return true;
    return variant === experiment.variants[0];
  }, [experiment, variant]);

  // Check if active
  const isActive = useMemo(
    () => isExperimentActive(experimentName),
    [experimentName]
  );

  // Track exposure on mount
  useEffect(() => {
    if (variant && !hasTrackedExposure) {
      trackExposure(experimentName, userId);
      setHasTrackedExposure(true);
    }
  }, [experimentName, userId, variant, hasTrackedExposure]);

  // Conversion tracking function
  const handleTrackConversion = useCallback(
    (conversionName: string, value?: number) => {
      trackConversion(experimentName, conversionName, userId, value);
    },
    [experimentName, userId]
  );

  // Metric tracking function
  const handleTrackMetric = useCallback(
    (metricName: string, value: number) => {
      trackMetric(experimentName, metricName, value, userId);
    },
    [experimentName, userId]
  );

  return {
    variant,
    isControl,
    isActive,
    trackConversion: handleTrackConversion,
    trackMetric: handleTrackMetric,
    experiment,
  };
}

/**
 * Check if user has specific variant
 *
 * @example
 * const showCinematic = useVariant('v7_hero_style', 'cinematic');
 */
export function useVariant(
  experimentName: string,
  targetVariant: VariantName
): boolean {
  const { variant } = useExperiment(experimentName);
  return variant === targetVariant;
}

/**
 * Check if user is in treatment (any non-control variant)
 *
 * @example
 * const isInTreatment = useIsInTreatment('v7_hero_style');
 */
export function useIsInTreatment(experimentName: string): boolean {
  const { isControl, isActive } = useExperiment(experimentName);
  return isActive && !isControl;
}

/**
 * Get all experiment assignments for current user
 *
 * @example
 * const assignments = useAllExperiments();
 * // { v7_hero_style: { variant: 'cinematic', ... }, ... }
 */
export function useAllExperiments(): Record<string, ExperimentAssignment> {
  const { context } = useFeatureFlagContext();
  const userId = context.userId || context.sessionId || "anonymous";

  return useMemo(() => getAllAssignments(userId), [userId]);
}

/**
 * Get list of active experiments
 *
 * @example
 * const experiments = useActiveExperiments();
 */
export function useActiveExperiments(): ExperimentConfig[] {
  return useMemo(() => getActiveExperiments(), []);
}

// ============================================
// COMPONENTS
// ============================================

interface ExperimentProps {
  name: string;
  children: (result: UseExperimentResult) => React.ReactNode;
}

/**
 * Render prop component for experiments
 *
 * @example
 * <Experiment name="v7_hero_style">
 *   {({ variant }) => {
 *     switch (variant) {
 *       case 'cinematic': return <HeroCinematic />;
 *       default: return <HeroControl />;
 *     }
 *   }}
 * </Experiment>
 */
export function Experiment({ name, children }: ExperimentProps) {
  const result = useExperiment(name);
  return <>{children(result)}</>;
}

interface VariantSwitchProps {
  experiment: string;
  variants: Record<VariantName, React.ReactNode>;
  fallback?: React.ReactNode;
}

/**
 * Switch component for rendering variants
 *
 * @example
 * <VariantSwitch
 *   experiment="v7_hero_style"
 *   variants={{
 *     control: <HeroControl />,
 *     parallax_light: <HeroParallaxLight />,
 *     parallax_full: <HeroParallaxFull />,
 *     cinematic: <HeroCinematic />,
 *   }}
 * />
 */
export function VariantSwitch({
  experiment,
  variants,
  fallback,
}: VariantSwitchProps) {
  const { variant } = useExperiment(experiment);

  if (!variant) {
    return <>{fallback || variants.control || null}</>;
  }

  return <>{variants[variant] || variants.control || fallback || null}</>;
}

interface ABTestProps {
  experiment: string;
  control: React.ReactNode;
  treatment: React.ReactNode;
}

/**
 * Simple A/B test component (control vs treatment)
 *
 * @example
 * <ABTest
 *   experiment="v7_checkout_style"
 *   control={<CheckoutClassic />}
 *   treatment={<CheckoutWizard />}
 * />
 */
export function ABTest({ experiment, control, treatment }: ABTestProps) {
  const { isControl } = useExperiment(experiment);
  return <>{isControl ? control : treatment}</>;
}
