/**
 * Hand-authored, app-level type aliases and unions layered on top of the
 * GENERATED `Database` type in ./database.generated. Kept separate so
 * `pnpm gen:types` can overwrite the generated file without clobbering these.
 *
 * Re-exported (with the generated types) from ./database — import from
 * "@/types/database" as before.
 */
import type { Database } from "./database.generated";

// --- Custom union types (superset of DB enums for app-level usage) ---

export type OrderStatus =
  | "pending_approval"
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "stripe" | "cod";

export type RefundStatus = "none" | "partial" | "full";

export type ProfileRole = "customer" | "admin" | "driver";

export type ModifierSelectionType = "single" | "multiple";

export type OrderAuditAction =
  | "status_change"
  | "cancel"
  | "refund"
  | "edit"
  | "update_items"
  | "assign_driver"
  | "unassign_driver"
  | "priority_change";

export type OrderAuditActorRole = "customer" | "admin" | "driver" | "system";

// --- Row type aliases ---

export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfilesInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type AddressesRow = Database["public"]["Tables"]["addresses"]["Row"];
export type AddressesInsert = Database["public"]["Tables"]["addresses"]["Insert"];
export type AddressesUpdate = Database["public"]["Tables"]["addresses"]["Update"];

export type MenuCategoriesRow = Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuCategoriesInsert = Database["public"]["Tables"]["menu_categories"]["Insert"];
export type MenuCategoriesUpdate = Database["public"]["Tables"]["menu_categories"]["Update"];

export type MenuItemsRow = Database["public"]["Tables"]["menu_items"]["Row"];
export type MenuItemsInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
export type MenuItemsUpdate = Database["public"]["Tables"]["menu_items"]["Update"];

export type ModifierGroupsRow = Database["public"]["Tables"]["modifier_groups"]["Row"];
export type ModifierGroupsInsert = Database["public"]["Tables"]["modifier_groups"]["Insert"];
export type ModifierGroupsUpdate = Database["public"]["Tables"]["modifier_groups"]["Update"];

export type ModifierOptionsRow = Database["public"]["Tables"]["modifier_options"]["Row"];
export type ModifierOptionsInsert = Database["public"]["Tables"]["modifier_options"]["Insert"];
export type ModifierOptionsUpdate = Database["public"]["Tables"]["modifier_options"]["Update"];

export type ItemModifierGroupsRow = Database["public"]["Tables"]["item_modifier_groups"]["Row"];
export type ItemModifierGroupsInsert =
  Database["public"]["Tables"]["item_modifier_groups"]["Insert"];
export type ItemModifierGroupsUpdate =
  Database["public"]["Tables"]["item_modifier_groups"]["Update"];

export type OrdersRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrdersInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrdersUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderItemsRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemsInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderItemsUpdate = Database["public"]["Tables"]["order_items"]["Update"];

export type OrderItemModifiersRow = Database["public"]["Tables"]["order_item_modifiers"]["Row"];
export type OrderItemModifiersInsert =
  Database["public"]["Tables"]["order_item_modifiers"]["Insert"];
export type OrderItemModifiersUpdate =
  Database["public"]["Tables"]["order_item_modifiers"]["Update"];

export type OrderAuditLogRow = Database["public"]["Tables"]["order_audit_log"]["Row"];
export type OrderAuditLogInsert = Database["public"]["Tables"]["order_audit_log"]["Insert"];
export type OrderAuditLogUpdate = Database["public"]["Tables"]["order_audit_log"]["Update"];

export type FeaturedSectionsRow = Database["public"]["Tables"]["featured_sections"]["Row"];
export type FeaturedSectionsInsert = Database["public"]["Tables"]["featured_sections"]["Insert"];
export type FeaturedSectionsUpdate = Database["public"]["Tables"]["featured_sections"]["Update"];

export type FeaturedSectionItemsRow = Database["public"]["Tables"]["featured_section_items"]["Row"];
export type FeaturedSectionItemsInsert =
  Database["public"]["Tables"]["featured_section_items"]["Insert"];
export type FeaturedSectionItemsUpdate =
  Database["public"]["Tables"]["featured_section_items"]["Update"];

export type DriverInvitesRow = Database["public"]["Tables"]["driver_invites"]["Row"];
export type DriverInvitesInsert = Database["public"]["Tables"]["driver_invites"]["Insert"];
export type DriverInvitesUpdate = Database["public"]["Tables"]["driver_invites"]["Update"];

export type DriverRatingsRow = Database["public"]["Tables"]["driver_ratings"]["Row"];
export type DriverRatingsInsert = Database["public"]["Tables"]["driver_ratings"]["Insert"];
export type DriverRatingsUpdate = Database["public"]["Tables"]["driver_ratings"]["Update"];

export type CustomerSettingsRow = Database["public"]["Tables"]["customer_settings"]["Row"];
export type CustomerSettingsInsert = Database["public"]["Tables"]["customer_settings"]["Insert"];
export type CustomerSettingsUpdate = Database["public"]["Tables"]["customer_settings"]["Update"];

export type WebhookEventsRow = Database["public"]["Tables"]["webhook_events"]["Row"];
export type WebhookEventsInsert = Database["public"]["Tables"]["webhook_events"]["Insert"];
export type WebhookEventsUpdate = Database["public"]["Tables"]["webhook_events"]["Update"];

export type WebhookAuditLogsRow = Database["public"]["Tables"]["webhook_audit_logs"]["Row"];
export type WebhookAuditLogsInsert = Database["public"]["Tables"]["webhook_audit_logs"]["Insert"];
export type WebhookAuditLogsUpdate = Database["public"]["Tables"]["webhook_audit_logs"]["Update"];

export type DeliveryDaysRow = Database["public"]["Tables"]["delivery_days"]["Row"];
export type DeliveryDaysInsert = Database["public"]["Tables"]["delivery_days"]["Insert"];
export type DeliveryDaysUpdate = Database["public"]["Tables"]["delivery_days"]["Update"];

export type DeliveryZonesRow = Database["public"]["Tables"]["delivery_zones"]["Row"];
export type DeliveryZonesInsert = Database["public"]["Tables"]["delivery_zones"]["Insert"];
export type DeliveryZonesUpdate = Database["public"]["Tables"]["delivery_zones"]["Update"];

// --- Generic types for dynamic table access ---

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

export type GenericView =
  | {
      Row: Record<string, unknown>;
      Relationships: GenericRelationship[];
    }
  | {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
      Relationships: GenericRelationship[];
    };

export type GenericFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
  SetofOptions?: {
    isSetofReturn?: boolean;
    isOneToOne?: boolean;
    isNotNullable?: boolean;
    to: string;
    from: string;
  };
};
