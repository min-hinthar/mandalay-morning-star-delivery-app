/**
 * V7 A/B Testing Integration
 *
 * Sprint 11: Feature Flags & Rollout
 * Experiment tracking and variant assignment
 *
 * @example
 * // Define experiment
 * const experiment = defineExperiment({
 *   name: 'v7_hero_variant',
 *   variants: ['control', 'animated', 'cinematic'],
 *   weights: [34, 33, 33],
 * });
 *
 * // Get variant
 * const variant = getVariant(experiment, userId);
 */

import * as Sentry from "@sentry/nextjs";

// ============================================
// TYPES
// ============================================

export type VariantName = string;

export interface ExperimentConfig {
  /** Unique experiment name */
  name: string;
  /** Description for documentation */
  description?: string;
  /** Variant names */
  variants: VariantName[];
  /** Weights for each variant (must sum to 100) */
  weights: number[];
  /** Whether experiment is active */
  active: boolean;
  /** Start date (ISO string) */
  startDate?: string;
  /** End date (ISO string) */
  endDate?: string;
  /** User segments to include */
  segments?: string[];
  /** Minimum sample size before analysis */
  minSampleSize?: number;
}

export interface ExperimentAssignment {
  experimentName: string;
  variant: VariantName;
  userId: string;
  timestamp: number;
  isControl: boolean;
}

export interface ExperimentMetric {
  experimentName: string;
  variant: VariantName;
  metricName: string;
  value: number;
  userId: string;
  timestamp: number;
}

// ============================================
// EXPERIMENT DEFINITIONS
// ============================================

export const EXPERIMENTS: Record<string, ExperimentConfig> = {
  // V7 Hero Variants
  v7_hero_style: {
    name: "v7_hero_style",
    description: "Test different V7 hero animation styles",
    variants: ["control", "parallax_light", "parallax_full", "cinematic"],
    weights: [25, 25, 25, 25],
    active: true,
    minSampleSize: 1000,
  },

  // Menu Animation Intensity
  v7_menu_animations: {
    name: "v7_menu_animations",
    description: "Test menu animation intensity levels",
    variants: ["control", "subtle", "moderate", "maximum"],
    weights: [25, 25, 25, 25],
    active: true,
    minSampleSize: 500,
  },

  // Add to Cart Celebration
  v7_cart_celebration: {
    name: "v7_cart_celebration",
    description: "Test add-to-cart celebration styles",
    variants: ["none", "confetti_light", "confetti_full", "flying_item"],
    weights: [25, 25, 25, 25],
    active: true,
    minSampleSize: 500,
  },

  // Onboarding Flow
  v7_onboarding_steps: {
    name: "v7_onboarding_steps",
    description: "Test onboarding step count",
    variants: ["3_steps", "5_steps", "7_steps"],
    weights: [34, 33, 33],
    active: true,
    minSampleSize: 200,
  },

  // Checkout Flow
  v7_checkout_style: {
    name: "v7_checkout_style",
    description: "Test checkout wizard vs single page",
    variants: ["control", "wizard", "single_page"],
    weights: [34, 33, 33],
    active: true,
    minSampleSize: 300,
  },
};

// ============================================
// HASHING & BUCKETING
// ============================================

/**
 * Hash string to number between 0-99
 */
function hashToBucket(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

/**
 * Assign user to variant based on weights
 */
function assignVariant(
  experiment: ExperimentConfig,
  userId: string
): VariantName {
  const bucket = hashToBucket(`${experiment.name}:${userId}`);

  let cumulative = 0;
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulative += experiment.weights[i];
    if (bucket < cumulative) {
      return experiment.variants[i];
    }
  }

  // Fallback to first variant (control)
  return experiment.variants[0];
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Define a new experiment
 */
export function defineExperiment(
  config: Omit<ExperimentConfig, "active"> & { active?: boolean }
): ExperimentConfig {
  // Validate weights sum to 100
  const weightSum = config.weights.reduce((a, b) => a + b, 0);
  if (weightSum !== 100) {
    console.warn(
      `Experiment ${config.name}: weights sum to ${weightSum}, not 100`
    );
  }

  // Validate variant count matches weight count
  if (config.variants.length !== config.weights.length) {
    throw new Error(
      `Experiment ${config.name}: variant count (${config.variants.length}) doesn't match weight count (${config.weights.length})`
    );
  }

  return {
    ...config,
    active: config.active ?? true,
  };
}

/**
 * Get variant for user
 */
export function getVariant(
  experimentName: string,
  userId: string
): VariantName | null {
  const experiment = EXPERIMENTS[experimentName];

  if (!experiment) {
    console.warn(`Unknown experiment: ${experimentName}`);
    return null;
  }

  // Check if experiment is active
  if (!experiment.active) {
    return experiment.variants[0]; // Return control
  }

  // Check date range
  if (experiment.startDate && new Date() < new Date(experiment.startDate)) {
    return experiment.variants[0];
  }
  if (experiment.endDate && new Date() > new Date(experiment.endDate)) {
    return experiment.variants[0];
  }

  return assignVariant(experiment, userId);
}

/**
 * Get experiment assignment with metadata
 */
export function getExperimentAssignment(
  experimentName: string,
  userId: string
): ExperimentAssignment | null {
  const variant = getVariant(experimentName, userId);

  if (!variant) return null;

  const experiment = EXPERIMENTS[experimentName];

  return {
    experimentName,
    variant,
    userId,
    timestamp: Date.now(),
    isControl: variant === experiment.variants[0],
  };
}

/**
 * Check if user is in treatment group (any non-control variant)
 */
export function isInTreatment(experimentName: string, userId: string): boolean {
  const assignment = getExperimentAssignment(experimentName, userId);
  return assignment ? !assignment.isControl : false;
}

/**
 * Check if user has specific variant
 */
export function hasVariant(
  experimentName: string,
  variant: VariantName,
  userId: string
): boolean {
  return getVariant(experimentName, userId) === variant;
}

// ============================================
// ANALYTICS & TRACKING
// ============================================

/**
 * Track experiment exposure
 * Call this when user sees the experiment
 */
export function trackExposure(
  experimentName: string,
  userId: string,
  additionalData?: Record<string, unknown>
): void {
  const assignment = getExperimentAssignment(experimentName, userId);

  if (!assignment) return;

  const exposureEvent = {
    event: "experiment_exposure",
    ...assignment,
    ...additionalData,
  };

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[A/B Test Exposure]", exposureEvent);
  }

  // Send to Sentry for tracking
  Sentry.addBreadcrumb({
    category: "experiment",
    message: `Exposed to ${experimentName}: ${assignment.variant}`,
    level: "info",
    data: exposureEvent,
  });

  // Send to analytics (integrate with your provider)
  if (typeof window !== "undefined") {
    // Example: Segment
    // (window as any).analytics?.track('Experiment Exposure', exposureEvent);

    // Example: Google Analytics
    // (window as any).gtag?.('event', 'experiment_exposure', exposureEvent);

    // Store in session for debugging
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("ab_exposures") || "[]"
      );
      stored.push(exposureEvent);
      sessionStorage.setItem("ab_exposures", JSON.stringify(stored));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Track experiment metric/conversion
 */
export function trackMetric(
  experimentName: string,
  metricName: string,
  value: number,
  userId: string
): void {
  const variant = getVariant(experimentName, userId);

  if (!variant) return;

  const metric: ExperimentMetric = {
    experimentName,
    variant,
    metricName,
    value,
    userId,
    timestamp: Date.now(),
  };

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[A/B Test Metric]", metric);
  }

  // Send to Sentry
  Sentry.addBreadcrumb({
    category: "experiment",
    message: `Metric ${metricName} for ${experimentName}`,
    level: "info",
    data: metric,
  });

  // Send to analytics
  if (typeof window !== "undefined") {
    // Example: Send to analytics endpoint
    // fetch('/api/analytics/experiment-metric', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    // });
  }
}

/**
 * Track conversion event
 */
export function trackConversion(
  experimentName: string,
  conversionName: string,
  userId: string,
  value?: number
): void {
  trackMetric(experimentName, `conversion_${conversionName}`, value ?? 1, userId);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all active experiments
 */
export function getActiveExperiments(): ExperimentConfig[] {
  return Object.values(EXPERIMENTS).filter((exp) => exp.active);
}

/**
 * Get user's assignments for all active experiments
 */
export function getAllAssignments(
  userId: string
): Record<string, ExperimentAssignment> {
  const result: Record<string, ExperimentAssignment> = {};

  for (const experiment of getActiveExperiments()) {
    const assignment = getExperimentAssignment(experiment.name, userId);
    if (assignment) {
      result[experiment.name] = assignment;
    }
  }

  return result;
}

/**
 * Get experiment by name
 */
export function getExperiment(name: string): ExperimentConfig | null {
  return EXPERIMENTS[name] || null;
}

/**
 * Check if experiment exists and is active
 */
export function isExperimentActive(name: string): boolean {
  const experiment = EXPERIMENTS[name];
  return experiment?.active ?? false;
}

// ============================================
// DEBUG HELPERS
// ============================================

/**
 * Force variant for testing (development only)
 */
export function forceVariant(
  experimentName: string,
  variant: VariantName
): void {
  if (process.env.NODE_ENV !== "development") {
    console.warn("forceVariant should only be used in development");
    return;
  }

  if (typeof window !== "undefined") {
    const overrides = JSON.parse(
      localStorage.getItem("ab_overrides") || "{}"
    );
    overrides[experimentName] = variant;
    localStorage.setItem("ab_overrides", JSON.stringify(overrides));
    console.log(`Forced ${experimentName} to variant: ${variant}`);
  }
}

/**
 * Clear forced variants
 */
export function clearForcedVariants(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ab_overrides");
    console.log("Cleared all forced variants");
  }
}

/**
 * Get forced variant (for development)
 */
export function getForcedVariant(experimentName: string): VariantName | null {
  if (typeof window === "undefined") return null;

  try {
    const overrides = JSON.parse(
      localStorage.getItem("ab_overrides") || "{}"
    );
    return overrides[experimentName] || null;
  } catch {
    return null;
  }
}

/**
 * Get variant with override support
 */
export function getVariantWithOverride(
  experimentName: string,
  userId: string
): VariantName | null {
  // Check for forced variant in development
  const forced = getForcedVariant(experimentName);
  if (forced) {
    return forced;
  }

  return getVariant(experimentName, userId);
}
