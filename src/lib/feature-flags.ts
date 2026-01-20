/**
 * V7 Feature Flag System
 *
 * Sprint 11: Feature Flags & Rollout
 * Gradual rollout with user segmentation
 *
 * Rollout Strategy:
 * 1. Internal team (100%)
 * 2. Beta users (10%)
 * 3. Gradual: 25% → 50% → 100%
 *
 * @example
 * import { useFeatureFlag, isFeatureEnabled } from '@/lib/feature-flags';
 *
 * // In components
 * const isV7Enabled = useFeatureFlag('v7_ui');
 *
 * // Server-side
 * if (isFeatureEnabled('v7_ui', userId)) { ... }
 */

// ============================================
// TYPES
// ============================================

export type FeatureFlagName =
  | "v7_ui"
  | "v7_animations"
  | "v7_hero"
  | "v7_menu"
  | "v7_cart"
  | "v7_checkout"
  | "v7_tracking"
  | "v7_admin"
  | "v7_driver"
  | "v7_auth"
  | "v7_onboarding"
  | "v7_celebrations"
  | "v7_sound"
  | "v7_webgl";

export type RolloutStage =
  | "internal"
  | "beta"
  | "gradual_10"
  | "gradual_25"
  | "gradual_50"
  | "gradual_75"
  | "general_availability";

export interface FeatureFlagConfig {
  /** Flag name */
  name: FeatureFlagName;
  /** Human-readable description */
  description: string;
  /** Current rollout stage */
  stage: RolloutStage;
  /** Percentage of users (0-100) */
  rolloutPercentage: number;
  /** Override: always enable for these user IDs */
  allowlist?: string[];
  /** Override: always disable for these user IDs */
  blocklist?: string[];
  /** Enable for internal team */
  enableForInternal?: boolean;
  /** Enable for beta users */
  enableForBeta?: boolean;
  /** Dependencies - other flags that must be enabled */
  dependencies?: FeatureFlagName[];
  /** Fallback behavior if evaluation fails */
  fallback: boolean;
}

export interface FeatureFlagContext {
  userId?: string;
  userEmail?: string;
  isInternalUser?: boolean;
  isBetaUser?: boolean;
  userSegment?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  sessionId?: string;
}

// ============================================
// FLAG DEFINITIONS
// ============================================

const INTERNAL_DOMAINS = ["@mandalay-morning-star.com", "@internal.test"];
const BETA_USER_SEGMENT = "beta_testers";

export const FLAGS: Record<FeatureFlagName, FeatureFlagConfig> = {
  // Master V7 flag
  v7_ui: {
    name: "v7_ui",
    description: "Enable V7 motion-first UI redesign",
    stage: "gradual_25",
    rolloutPercentage: 25,
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  // Animation system
  v7_animations: {
    name: "v7_animations",
    description: "V7 animation system (requires v7_ui)",
    stage: "gradual_25",
    rolloutPercentage: 25,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  // Component flags (granular rollout)
  v7_hero: {
    name: "v7_hero",
    description: "V7 cinematic hero with parallax",
    stage: "gradual_50",
    rolloutPercentage: 50,
    dependencies: ["v7_ui", "v7_animations"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_menu: {
    name: "v7_menu",
    description: "V7 menu with FLIP animations",
    stage: "gradual_25",
    rolloutPercentage: 25,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_cart: {
    name: "v7_cart",
    description: "V7 cart with flying items and confetti",
    stage: "gradual_25",
    rolloutPercentage: 25,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_checkout: {
    name: "v7_checkout",
    description: "V7 checkout wizard with animations",
    stage: "gradual_10",
    rolloutPercentage: 10,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_tracking: {
    name: "v7_tracking",
    description: "V7 order tracking with live map",
    stage: "gradual_25",
    rolloutPercentage: 25,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_admin: {
    name: "v7_admin",
    description: "V7 admin dashboard",
    stage: "internal",
    rolloutPercentage: 0,
    enableForInternal: true,
    enableForBeta: false,
    fallback: false,
  },

  v7_driver: {
    name: "v7_driver",
    description: "V7 driver app with gamification",
    stage: "beta",
    rolloutPercentage: 0,
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_auth: {
    name: "v7_auth",
    description: "V7 glassmorphism auth modal",
    stage: "gradual_50",
    rolloutPercentage: 50,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_onboarding: {
    name: "v7_onboarding",
    description: "V7 animated onboarding tour",
    stage: "gradual_25",
    rolloutPercentage: 25,
    dependencies: ["v7_ui", "v7_animations"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_celebrations: {
    name: "v7_celebrations",
    description: "V7 confetti and celebration animations",
    stage: "gradual_25",
    rolloutPercentage: 25,
    dependencies: ["v7_ui", "v7_animations"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_sound: {
    name: "v7_sound",
    description: "V7 sound effects",
    stage: "beta",
    rolloutPercentage: 0,
    dependencies: ["v7_ui"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },

  v7_webgl: {
    name: "v7_webgl",
    description: "V7 WebGL particles and effects",
    stage: "beta",
    rolloutPercentage: 0,
    dependencies: ["v7_ui", "v7_animations"],
    enableForInternal: true,
    enableForBeta: true,
    fallback: false,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Hash a string to a number between 0-100
 * Used for consistent percentage-based bucketing
 */
function hashToPercentage(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Check if user is internal team member
 */
function isInternalUser(context: FeatureFlagContext): boolean {
  if (context.isInternalUser !== undefined) {
    return context.isInternalUser;
  }

  if (context.userEmail) {
    return INTERNAL_DOMAINS.some((domain) =>
      context.userEmail?.endsWith(domain)
    );
  }

  return false;
}

/**
 * Check if user is beta tester
 */
function isBetaUser(context: FeatureFlagContext): boolean {
  if (context.isBetaUser !== undefined) {
    return context.isBetaUser;
  }

  return context.userSegment === BETA_USER_SEGMENT;
}

/**
 * Get stable identifier for bucketing
 */
function getBucketId(context: FeatureFlagContext): string {
  return context.userId || context.sessionId || "anonymous";
}

// ============================================
// CORE EVALUATION
// ============================================

/**
 * Evaluate a feature flag for a given context
 */
export function evaluateFeatureFlag(
  flagName: FeatureFlagName,
  context: FeatureFlagContext = {}
): boolean {
  const flag = FLAGS[flagName];

  if (!flag) {
    console.warn(`Unknown feature flag: ${flagName}`);
    return false;
  }

  try {
    // Check blocklist first
    if (flag.blocklist?.includes(context.userId || "")) {
      return false;
    }

    // Check allowlist
    if (flag.allowlist?.includes(context.userId || "")) {
      return true;
    }

    // Check internal user override
    if (flag.enableForInternal && isInternalUser(context)) {
      return true;
    }

    // Check beta user override
    if (flag.enableForBeta && isBetaUser(context)) {
      return true;
    }

    // Check dependencies
    if (flag.dependencies) {
      for (const dep of flag.dependencies) {
        if (!evaluateFeatureFlag(dep, context)) {
          return false;
        }
      }
    }

    // Percentage-based rollout
    if (flag.rolloutPercentage > 0) {
      const bucketId = getBucketId(context);
      const bucket = hashToPercentage(`${flagName}:${bucketId}`);
      return bucket < flag.rolloutPercentage;
    }

    return false;
  } catch (error) {
    console.error(`Error evaluating feature flag ${flagName}:`, error);
    return flag.fallback;
  }
}

/**
 * Simple check if feature is enabled (server-side)
 */
export function isFeatureEnabled(
  flagName: FeatureFlagName,
  userId?: string
): boolean {
  return evaluateFeatureFlag(flagName, { userId });
}

/**
 * Get all enabled flags for a context
 */
export function getEnabledFlags(
  context: FeatureFlagContext = {}
): FeatureFlagName[] {
  return Object.keys(FLAGS).filter((flagName) =>
    evaluateFeatureFlag(flagName as FeatureFlagName, context)
  ) as FeatureFlagName[];
}

/**
 * Get flag configuration
 */
export function getFlagConfig(flagName: FeatureFlagName): FeatureFlagConfig {
  return FLAGS[flagName];
}

/**
 * Get all flag configurations
 */
export function getAllFlags(): Record<FeatureFlagName, FeatureFlagConfig> {
  return FLAGS;
}

// ============================================
// ENVIRONMENT OVERRIDES
// ============================================

/**
 * Check for environment variable overrides
 * Format: NEXT_PUBLIC_FF_V7_UI=true
 */
export function getEnvOverride(flagName: FeatureFlagName): boolean | null {
  if (typeof process === "undefined") return null;

  const envKey = `NEXT_PUBLIC_FF_${flagName.toUpperCase()}`;
  const value = process.env[envKey];

  if (value === "true") return true;
  if (value === "false") return false;

  return null;
}

/**
 * Evaluate with environment override support
 */
export function evaluateWithOverrides(
  flagName: FeatureFlagName,
  context: FeatureFlagContext = {}
): boolean {
  // Check env override first
  const envOverride = getEnvOverride(flagName);
  if (envOverride !== null) {
    return envOverride;
  }

  return evaluateFeatureFlag(flagName, context);
}

// ============================================
// ROLLOUT MANAGEMENT
// ============================================

/**
 * Update flag rollout percentage (runtime)
 * Note: In production, this would sync with a remote config service
 */
export function updateRolloutPercentage(
  flagName: FeatureFlagName,
  percentage: number
): void {
  if (FLAGS[flagName]) {
    FLAGS[flagName].rolloutPercentage = Math.max(0, Math.min(100, percentage));
  }
}

/**
 * Update flag stage
 */
export function updateFlagStage(
  flagName: FeatureFlagName,
  stage: RolloutStage
): void {
  if (FLAGS[flagName]) {
    FLAGS[flagName].stage = stage;

    // Auto-update percentage based on stage
    switch (stage) {
      case "internal":
        FLAGS[flagName].rolloutPercentage = 0;
        break;
      case "beta":
        FLAGS[flagName].rolloutPercentage = 0;
        break;
      case "gradual_10":
        FLAGS[flagName].rolloutPercentage = 10;
        break;
      case "gradual_25":
        FLAGS[flagName].rolloutPercentage = 25;
        break;
      case "gradual_50":
        FLAGS[flagName].rolloutPercentage = 50;
        break;
      case "gradual_75":
        FLAGS[flagName].rolloutPercentage = 75;
        break;
      case "general_availability":
        FLAGS[flagName].rolloutPercentage = 100;
        break;
    }
  }
}

// ============================================
// ANALYTICS HELPERS
// ============================================

/**
 * Get flag state for analytics tracking
 */
export function getFlagStateForAnalytics(
  context: FeatureFlagContext
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const flagName of Object.keys(FLAGS) as FeatureFlagName[]) {
    result[flagName] = evaluateFeatureFlag(flagName, context);
  }

  return result;
}

/**
 * Get exposure event for A/B testing
 */
export function getExposureEvent(
  flagName: FeatureFlagName,
  context: FeatureFlagContext
): {
  flag: string;
  variant: string;
  userId: string;
  timestamp: number;
} {
  const isEnabled = evaluateFeatureFlag(flagName, context);

  return {
    flag: flagName,
    variant: isEnabled ? "treatment" : "control",
    userId: getBucketId(context),
    timestamp: Date.now(),
  };
}
