// Shared types and constants for customer settings UI
// Pure types/schemas — no hooks, no 'use client'

// ============================================
// DIETARY OPTIONS
// ============================================

export type DietaryOption =
  | "Vegetarian"
  | "Vegan"
  | "Gluten-free"
  | "Nut allergy"
  | "Dairy-free"
  | "Halal";

export const DIETARY_OPTIONS: readonly DietaryOption[] = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Nut allergy",
  "Dairy-free",
  "Halal",
] as const;

export const DIETARY_EMOJIS: Record<DietaryOption, string> = {
  Vegetarian: "\u{1F331}",
  Vegan: "\u{1F33F}",
  "Gluten-free": "\u{1F33E}",
  "Nut allergy": "\u{1F95C}",
  "Dairy-free": "\u{1F95B}",
  Halal: "\u2728",
};

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPrefs {
  order_updates: boolean;
  marketing: boolean;
  reminders: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  order_updates: true,
  marketing: true,
  reminders: true,
};

export interface NotificationGroup {
  key: keyof NotificationPrefs;
  title: string;
  description: string;
  iconName: "Package" | "Megaphone" | "Bell";
  subCategories: string[];
  warningText: string;
}

export const NOTIFICATION_GROUPS: readonly NotificationGroup[] = [
  {
    key: "order_updates",
    title: "Order Updates",
    description: "Stay informed about your delivery status",
    iconName: "Package",
    subCategories: [
      "Order confirmation",
      "Preparation started",
      "Out for delivery",
      "Delivered notification",
    ],
    warningText:
      "You won't receive updates about your order status. You can still check orders in the app.",
  },
  {
    key: "marketing",
    title: "Promotions & Deals",
    description: "Exclusive offers and seasonal specials",
    iconName: "Megaphone",
    subCategories: [
      "Weekly specials",
      "Holiday promotions",
      "New menu items",
      "Loyalty rewards",
    ],
    warningText:
      "You'll miss out on exclusive deals and promotions tailored for you.",
  },
  {
    key: "reminders",
    title: "Reminders",
    description: "Helpful nudges to reorder your favorites",
    iconName: "Bell",
    subCategories: [
      "Reorder suggestions",
      "Delivery window reminders",
      "Saved items back in stock",
    ],
    warningText:
      "You won't receive reminders about reordering or delivery windows.",
  },
] as const;

// ============================================
// CUSTOMER SETTINGS
// ============================================

export interface CustomerSettings {
  dietaryRestrictions: string[];
  customAllergies: string[];
  deliveryInstructions: string;
  notificationPrefs: NotificationPrefs;
  theme: "system" | "light" | "dark";
}

export const DEFAULT_CUSTOMER_SETTINGS: CustomerSettings = {
  dietaryRestrictions: [],
  customAllergies: [],
  deliveryInstructions: "",
  notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
  theme: "system",
};
