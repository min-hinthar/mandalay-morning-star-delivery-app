/**
 * Settings Types
 * Shared types for admin settings components
 *
 * Extracted to break circular dependency between SettingsClient and form components.
 */

export interface DeliverySettings {
  deliveryRadiusMiles: number;
  minimumOrderCents: number;
  freeDeliveryThresholdCents: number;
  baseDeliveryFeeCents: number;
  deliveryCutoffTime: string;
}

export interface OperationsSettings {
  maxStopsPerRoute: number;
  autoAssignEnabled: boolean;
  routeOptimizationEnabled: boolean;
  defaultVehicleType: "car" | "motorcycle" | "bicycle" | "van" | "truck";
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  notifyOnOrderPlaced: boolean;
  notifyOnOrderStatusChange: boolean;
}

export interface AllSettings {
  delivery: DeliverySettings;
  operations: OperationsSettings;
  notifications: NotificationSettings;
}
