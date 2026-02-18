/**
 * Settings Types
 * Shared types for admin settings components
 *
 * Extracted to break circular dependency between SettingsClient and form components.
 */

// ===========================================
// DELIVERY ZONE TYPES
// ===========================================

export interface DeliveryZone {
  name: string;
  feeCents: number;
  description: string;
}

// ===========================================
// STORE HOURS TYPES
// ===========================================

export interface DayHours {
  open: string; // HH:MM
  close: string; // HH:MM
  closed: boolean;
}

export type WeeklyStoreHours = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  DayHours
>;

// ===========================================
// DELIVERY TIME WINDOW TYPE
// ===========================================

export interface DeliveryTimeWindow {
  start: string; // HH:MM
  end: string; // HH:MM
  label?: string;
}

// ===========================================
// SETTINGS INTERFACES
// ===========================================

export interface DeliverySettings {
  deliveryRadiusMiles: number;
  minimumOrderCents: number;
  freeDeliveryThresholdCents: number;
  baseDeliveryFeeCents: number;
  deliveryCutoffTime: string;
  deliveryTimeWindows: DeliveryTimeWindow[];
  deliveryZones: DeliveryZone[];
}

export interface OperationsSettings {
  maxStopsPerRoute: number;
  autoAssignEnabled: boolean;
  routeOptimizationEnabled: boolean;
  defaultVehicleType: "car" | "motorcycle" | "bicycle" | "van" | "truck";
  storeHours: WeeklyStoreHours;
  maxOrdersPerSlot: number;
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  notifyOnOrderPlaced: boolean;
  notifyOnOrderStatusChange: boolean;
  lowStockThreshold: number;
  dailySummaryEnabled: boolean;
}

export interface AllSettings {
  delivery: DeliverySettings;
  operations: OperationsSettings;
  notifications: NotificationSettings;
}
