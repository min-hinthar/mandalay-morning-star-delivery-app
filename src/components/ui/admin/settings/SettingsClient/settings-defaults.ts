/**
 * Settings Defaults & Fetch Mapping
 * Extracted from SettingsClient to keep main component under 400 lines.
 */

import type { AllSettings } from "../settings-types";

export const DEFAULT_SETTINGS: AllSettings = {
  delivery: {
    deliveryRadiusMiles: 40,
    minimumOrderCents: 2500,
    freeDeliveryThresholdCents: 10000,
    baseDeliveryFeeCents: 1500,
    cutoffDay: 5,
    cutoffHour: 15,
    deliveryStartHour: 11,
    deliveryEndHour: 19,
    maxDeliveryDurationMinutes: 60,
    deliveryZones: [],
    longDistanceFeeCents: 2000,
    longDistanceThresholdMiles: 25,
  },
  operations: {
    maxStopsPerRoute: 15,
    autoAssignEnabled: false,
    routeOptimizationEnabled: true,
    defaultVehicleType: "car",
    storeHours: {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "21:00", closed: false },
      saturday: { open: "10:00", close: "22:00", closed: false },
      sunday: { open: "10:00", close: "20:00", closed: false },
    },
    maxOrdersPerSlot: 20,
  },
  notifications: {
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    pushNotificationsEnabled: false,
    notifyOnOrderPlaced: true,
    notifyOnOrderStatusChange: true,
    lowStockThreshold: 10,
    dailySummaryEnabled: false,
  },
};

/**
 * Map API response to AllSettings with defaults fallback.
 * API returns camelCase keys grouped by category.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiResponse(data: any): AllSettings {
  return {
    delivery: {
      deliveryRadiusMiles:
        data.delivery?.deliveryRadiusMiles ?? DEFAULT_SETTINGS.delivery.deliveryRadiusMiles,
      minimumOrderCents:
        data.delivery?.minimumOrderCents ?? DEFAULT_SETTINGS.delivery.minimumOrderCents,
      freeDeliveryThresholdCents:
        data.delivery?.freeDeliveryThresholdCents ??
        DEFAULT_SETTINGS.delivery.freeDeliveryThresholdCents,
      baseDeliveryFeeCents:
        data.delivery?.baseDeliveryFeeCents ?? DEFAULT_SETTINGS.delivery.baseDeliveryFeeCents,
      cutoffDay: data.delivery?.cutoffDay ?? DEFAULT_SETTINGS.delivery.cutoffDay,
      cutoffHour: data.delivery?.cutoffHour ?? DEFAULT_SETTINGS.delivery.cutoffHour,
      deliveryStartHour:
        data.delivery?.deliveryStartHour ?? DEFAULT_SETTINGS.delivery.deliveryStartHour,
      deliveryEndHour: data.delivery?.deliveryEndHour ?? DEFAULT_SETTINGS.delivery.deliveryEndHour,
      maxDeliveryDurationMinutes:
        data.delivery?.maxDeliveryDurationMinutes ??
        DEFAULT_SETTINGS.delivery.maxDeliveryDurationMinutes,
      deliveryZones: data.delivery?.deliveryZones ?? DEFAULT_SETTINGS.delivery.deliveryZones,
      longDistanceFeeCents:
        data.delivery?.longDistanceFeeCents ?? DEFAULT_SETTINGS.delivery.longDistanceFeeCents,
      longDistanceThresholdMiles:
        data.delivery?.longDistanceThresholdMiles ??
        DEFAULT_SETTINGS.delivery.longDistanceThresholdMiles,
    },
    operations: {
      maxStopsPerRoute:
        data.operations?.maxStopsPerRoute ?? DEFAULT_SETTINGS.operations.maxStopsPerRoute,
      autoAssignEnabled:
        data.operations?.autoAssignEnabled ?? DEFAULT_SETTINGS.operations.autoAssignEnabled,
      routeOptimizationEnabled:
        data.operations?.routeOptimizationEnabled ??
        DEFAULT_SETTINGS.operations.routeOptimizationEnabled,
      defaultVehicleType:
        data.operations?.defaultVehicleType ?? DEFAULT_SETTINGS.operations.defaultVehicleType,
      storeHours: data.operations?.storeHours ?? DEFAULT_SETTINGS.operations.storeHours,
      maxOrdersPerSlot:
        data.operations?.maxOrdersPerSlot ?? DEFAULT_SETTINGS.operations.maxOrdersPerSlot,
    },
    notifications: {
      emailNotificationsEnabled:
        data.notifications?.emailNotificationsEnabled ??
        DEFAULT_SETTINGS.notifications.emailNotificationsEnabled,
      smsNotificationsEnabled:
        data.notifications?.smsNotificationsEnabled ??
        DEFAULT_SETTINGS.notifications.smsNotificationsEnabled,
      pushNotificationsEnabled:
        data.notifications?.pushNotificationsEnabled ??
        DEFAULT_SETTINGS.notifications.pushNotificationsEnabled,
      notifyOnOrderPlaced:
        data.notifications?.notifyOnOrderPlaced ??
        DEFAULT_SETTINGS.notifications.notifyOnOrderPlaced,
      notifyOnOrderStatusChange:
        data.notifications?.notifyOnOrderStatusChange ??
        DEFAULT_SETTINGS.notifications.notifyOnOrderStatusChange,
      lowStockThreshold:
        data.notifications?.lowStockThreshold ?? DEFAULT_SETTINGS.notifications.lowStockThreshold,
      dailySummaryEnabled:
        data.notifications?.dailySummaryEnabled ??
        DEFAULT_SETTINGS.notifications.dailySummaryEnabled,
    },
  };
}
