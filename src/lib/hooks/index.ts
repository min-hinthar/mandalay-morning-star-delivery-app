/**
 * Hooks Barrel Export
 * V5 Sprint 2.2 - Centralized hook exports
 */

// ============================================
// RESPONSIVE HOOKS
// ============================================

export {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBreakpoint,
  useBreakpointDown,
  useBreakpointBetween,
  useCurrentBreakpoint,
  useIsTouchDevice,
  useCanHover,
  breakpoints,
} from "./useResponsive";
export type { Breakpoint } from "./useResponsive";

// ============================================
// MEDIA & PREFERENCES
// ============================================

export { useMediaQuery } from "./useMediaQuery";
export { useAnimationPreference } from "./useAnimationPreference";
export { useReducedMotion, useSystemReducedMotion } from "./useReducedMotion";

// ============================================
// UI HOOKS
// ============================================

export { useLuminance } from "./useLuminance";
export { useScrollDirection } from "./useScrollDirection";
export {
  useScrollDirectionWithVelocity,
  type UseScrollDirectionWithVelocityOptions,
  type UseScrollDirectionWithVelocityReturn,
} from "./useScrollDirectionWithVelocity";
export {
  useHeaderVisibility,
  getHeaderTransition,
  type UseHeaderVisibilityOptions,
  type UseHeaderVisibilityReturn,
} from "./useHeaderVisibility";
export { useCommandPalette, type UseCommandPaletteReturn } from "./useCommandPalette";
export { useRecentSearches, type UseRecentSearchesReturn } from "./useRecentSearches";
export { useActiveCategory } from "./useActiveCategory";
export { useScrollSpy } from "./useScrollSpy";
export { useDebounce } from "./useDebounce";

// ============================================
// CART & CHECKOUT
// ============================================

export { useCart } from "./useCart";
export { useCartDrawer } from "./useCartDrawer";
export { useNavigationGuard } from "./useNavigationGuard";
export type { UseNavigationGuardOptions, UseNavigationGuardReturn } from "./useNavigationGuard";

// ============================================
// DATA HOOKS
// ============================================

export { useMenu } from "./useMenu";
export { useOrderHistorySearch, type OrderHistoryItem } from "./useOrderHistorySearch";
export { useAddresses } from "./useAddresses";
export { useTimeSlot } from "./useTimeSlot";
export { useCoverageCheck } from "./useCoverageCheck";
export {
  usePlacesAutocomplete,
  type PlacePrediction,
  type PlaceDetails,
} from "./usePlacesAutocomplete";

// ============================================
// AUTH
// ============================================

export { useAuth } from "./useAuth";

// ============================================
// REALTIME & TRACKING
// ============================================

export { useLocationTracking } from "./useLocationTracking";
export { useTrackingSubscription } from "./useTrackingSubscription";

// ============================================
// OFFLINE & SERVICE WORKER
// ============================================

export { useCustomerOfflineSync } from "./useCustomerOfflineSync";
export { useOfflineSync } from "./useOfflineSync";
export { useServiceWorker, invalidateMenuCache, reportCacheMetrics } from "./useServiceWorker";
export { useUpdateBanner } from "./useUpdateBanner";
export type { UseUpdateBannerReturn } from "./useUpdateBanner";

// ============================================
// TOAST
// ============================================

export { useToast, toast } from "./useToast";
export { useToast as useToastV8, toast as toastV8 } from "./useToastV8";
export type { Toast as ToastV8, ToastType as ToastTypeV8 } from "./useToastV8";

// ============================================
// OVERLAY HOOKS
// ============================================

export { useRouteChangeClose } from "./useRouteChangeClose";
export { useBodyScrollLock } from "./useBodyScrollLock";

// ============================================
// SAFE EFFECT UTILITIES
// ============================================

export { useMountedRef, useSafeTimeout, useSafeInterval, useSafeAsync } from "./useSafeEffects";
export type {
  SafeTimeoutControls,
  SafeIntervalControls,
  SafeAsyncControls,
} from "./useSafeEffects";

// ============================================
// DEVICE CAPABILITY
// ============================================

export { useDeviceCapability, type DeviceTier } from "./useDeviceCapability";

// ============================================
// DYNAMIC IMPORT & VIEWPORT
// ============================================

export { useViewportTrigger } from "./useViewportTrigger";
export { importWithRetry } from "./useDynamicImportWithRetry";
