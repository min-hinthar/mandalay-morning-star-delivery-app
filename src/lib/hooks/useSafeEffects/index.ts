"use client";

/**
 * Safe Effect Utility Hooks
 *
 * Collection of hooks that provide safe patterns for common side effects
 * that require cleanup on unmount. Prevents memory leaks and "setState on
 * unmounted component" warnings.
 *
 * @module useSafeEffects
 */

export { useMountedRef } from "./useMountedRef";
export { useSafeTimeout } from "./useSafeTimeout";
export type { SafeTimeoutControls } from "./useSafeTimeout";
export { useSafeInterval } from "./useSafeInterval";
export type { SafeIntervalControls } from "./useSafeInterval";
export { useSafeAsync } from "./useSafeAsync";
export type { SafeAsyncControls } from "./useSafeAsync";
