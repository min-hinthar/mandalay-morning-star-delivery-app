export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type RefundStatus = "none" | "partial" | "full";

export type ProfileRole = "customer" | "admin" | "driver";

export type ModifierSelectionType = "single" | "multiple";

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

export interface ProfilesRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface ProfilesInsert {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: ProfileRole;
  created_at?: string;
  updated_at?: string;
}

export interface ProfilesUpdate {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: ProfileRole;
  created_at?: string;
  updated_at?: string;
}

export interface AddressesRow {
  id: string;
  user_id: string;
  label: string;
  line_1: string;
  line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressesInsert {
  id?: string;
  user_id: string;
  label?: string;
  line_1: string;
  line_2?: string | null;
  city: string;
  state?: string;
  postal_code: string;
  formatted_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressesUpdate {
  id?: string;
  user_id?: string;
  label?: string;
  line_1?: string;
  line_2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  formatted_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MenuCategoriesRow {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategoriesInsert {
  id?: string;
  slug: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface MenuCategoriesUpdate {
  id?: string;
  slug?: string;
  name?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface MenuItemsRow {
  id: string;
  category_id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
  image_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItemsInsert {
  id?: string;
  category_id: string;
  slug: string;
  name_en: string;
  name_my?: string | null;
  description_en?: string | null;
  base_price_cents: number;
  image_url?: string | null;
  is_active?: boolean;
  is_sold_out?: boolean;
  allergens?: string[];
  tags?: string[];
  image_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemsUpdate {
  id?: string;
  category_id?: string;
  slug?: string;
  name_en?: string;
  name_my?: string | null;
  description_en?: string | null;
  base_price_cents?: number;
  image_url?: string | null;
  is_active?: boolean;
  is_sold_out?: boolean;
  allergens?: string[];
  tags?: string[];
  image_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ModifierGroupsRow {
  id: string;
  slug: string;
  name: string;
  selection_type: ModifierSelectionType;
  min_select: number;
  max_select: number;
  created_at: string;
}

export interface ModifierGroupsInsert {
  id?: string;
  slug: string;
  name: string;
  selection_type?: ModifierSelectionType;
  min_select?: number;
  max_select?: number;
  created_at?: string;
}

export interface ModifierGroupsUpdate {
  id?: string;
  slug?: string;
  name?: string;
  selection_type?: ModifierSelectionType;
  min_select?: number;
  max_select?: number;
  created_at?: string;
}

export interface ModifierOptionsRow {
  id: string;
  group_id: string;
  slug: string;
  name: string;
  price_delta_cents: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ModifierOptionsInsert {
  id?: string;
  group_id: string;
  slug: string;
  name: string;
  price_delta_cents?: number;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface ModifierOptionsUpdate {
  id?: string;
  group_id?: string;
  slug?: string;
  name?: string;
  price_delta_cents?: number;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface ItemModifierGroupsRow {
  item_id: string;
  group_id: string;
}

export interface ItemModifierGroupsInsert {
  item_id: string;
  group_id: string;
}

export interface ItemModifierGroupsUpdate {
  item_id?: string;
  group_id?: string;
}

export interface OrdersRow {
  id: string;
  user_id: string;
  address_id: string | null;
  assigned_driver_id: string | null;
  status: OrderStatus;
  refund_status: RefundStatus;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  stripe_payment_intent_id: string | null;
  is_priority: boolean;
  rating_dismissed: boolean;
  share_token: string | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdersInsert {
  id?: string;
  user_id: string;
  address_id?: string | null;
  assigned_driver_id?: string | null;
  status?: OrderStatus;
  refund_status?: RefundStatus;
  subtotal_cents: number;
  delivery_fee_cents?: number;
  tax_cents?: number;
  total_cents: number;
  delivery_window_start?: string | null;
  delivery_window_end?: string | null;
  special_instructions?: string | null;
  stripe_payment_intent_id?: string | null;
  is_priority?: boolean;
  rating_dismissed?: boolean;
  share_token?: string | null;
  placed_at?: string;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrdersUpdate {
  id?: string;
  user_id?: string;
  address_id?: string | null;
  assigned_driver_id?: string | null;
  status?: OrderStatus;
  refund_status?: RefundStatus;
  subtotal_cents?: number;
  delivery_fee_cents?: number;
  tax_cents?: number;
  total_cents?: number;
  delivery_window_start?: string | null;
  delivery_window_end?: string | null;
  special_instructions?: string | null;
  stripe_payment_intent_id?: string | null;
  is_priority?: boolean;
  rating_dismissed?: boolean;
  share_token?: string | null;
  placed_at?: string;
  confirmed_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

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

export interface OrderAuditLogRow {
  id: string;
  order_id: string;
  action: OrderAuditAction;
  actor_id: string;
  actor_role: OrderAuditActorRole;
  old_value: Json | null;
  new_value: Json | null;
  reason: string | null;
  created_at: string;
}

export interface OrderAuditLogInsert {
  id?: string;
  order_id: string;
  action: OrderAuditAction;
  actor_id: string;
  actor_role: OrderAuditActorRole;
  old_value?: Json | null;
  new_value?: Json | null;
  reason?: string | null;
  created_at?: string;
}

export interface OrderAuditLogUpdate {
  id?: string;
  order_id?: string;
  action?: OrderAuditAction;
  actor_id?: string;
  actor_role?: OrderAuditActorRole;
  old_value?: Json | null;
  new_value?: Json | null;
  reason?: string | null;
  created_at?: string;
}

export interface OrderItemsRow {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  base_price_snapshot: number;
  quantity: number;
  line_total_cents: number;
  special_instructions: string | null;
  refunded_quantity: number;
  created_at: string;
}

export interface OrderItemsInsert {
  id?: string;
  order_id: string;
  menu_item_id?: string | null;
  name_snapshot: string;
  base_price_snapshot: number;
  quantity?: number;
  line_total_cents: number;
  special_instructions?: string | null;
  refunded_quantity?: number;
  created_at?: string;
}

export interface OrderItemsUpdate {
  id?: string;
  order_id?: string;
  menu_item_id?: string | null;
  name_snapshot?: string;
  base_price_snapshot?: number;
  quantity?: number;
  line_total_cents?: number;
  special_instructions?: string | null;
  refunded_quantity?: number;
  created_at?: string;
}

export interface OrderItemModifiersRow {
  id: string;
  order_item_id: string;
  modifier_option_id: string | null;
  name_snapshot: string;
  price_delta_snapshot: number;
  created_at: string;
}

export interface OrderItemModifiersInsert {
  id?: string;
  order_item_id: string;
  modifier_option_id?: string | null;
  name_snapshot: string;
  price_delta_snapshot?: number;
  created_at?: string;
}

export interface OrderItemModifiersUpdate {
  id?: string;
  order_item_id?: string;
  modifier_option_id?: string | null;
  name_snapshot?: string;
  price_delta_snapshot?: number;
  created_at?: string;
}

export interface FeaturedSectionsRow {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  accent_color: string | null;
  sort_order: number;
  item_count: number;
  is_visible: boolean;
  is_predefined: boolean;
  has_unpublished_changes: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface FeaturedSectionsInsert {
  id?: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  icon?: string | null;
  accent_color?: string | null;
  sort_order?: number;
  item_count?: number;
  is_visible?: boolean;
  is_predefined?: boolean;
  has_unpublished_changes?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

export interface FeaturedSectionsUpdate {
  id?: string;
  slug?: string;
  name?: string;
  subtitle?: string | null;
  icon?: string | null;
  accent_color?: string | null;
  sort_order?: number;
  item_count?: number;
  is_visible?: boolean;
  is_predefined?: boolean;
  has_unpublished_changes?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

export interface FeaturedSectionItemsRow {
  section_id: string;
  item_id: string;
  sort_order: number;
}

export interface FeaturedSectionItemsInsert {
  section_id: string;
  item_id: string;
  sort_order?: number;
}

export interface FeaturedSectionItemsUpdate {
  section_id?: string;
  item_id?: string;
  sort_order?: number;
}

export interface DriverInvitesRow {
  id: string;
  email: string;
  token: string | null;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface DriverInvitesInsert {
  id?: string;
  email: string;
  token?: string | null;
  invited_by: string;
  expires_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
}

export interface DriverInvitesUpdate {
  id?: string;
  email?: string;
  token?: string;
  invited_by?: string;
  expires_at?: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
}

// ============================================
// CUSTOMER SETTINGS
// ============================================

export interface CustomerSettingsRow {
  user_id: string;
  dietary_restrictions: Json;
  delivery_instructions: string;
  default_address: Json | null;
  notification_prefs: Json;
  theme: string;
  updated_at: string;
}

export interface CustomerSettingsInsert {
  user_id: string;
  dietary_restrictions?: Json;
  delivery_instructions?: string;
  default_address?: Json | null;
  notification_prefs?: Json;
  theme?: string;
}

export interface CustomerSettingsUpdate {
  user_id?: string;
  dietary_restrictions?: Json;
  delivery_instructions?: string;
  default_address?: Json | null;
  notification_prefs?: Json;
  theme?: string;
}

// ============================================
// DRIVER RATINGS
// ============================================

export interface DriverRatingsRow {
  id: string;
  order_id: string;
  driver_id: string;
  user_id: string;
  route_stop_id: string;
  rating: number; // 1-5
  feedback_text: string | null;
  submitted_at: string;
  created_at: string;
}

export interface DriverRatingsInsert {
  order_id: string;
  driver_id: string;
  user_id?: string;
  route_stop_id: string;
  rating: number;
  feedback_text?: string | null;
  id?: string;
  created_at?: string;
  submitted_at?: string;
}

export interface DriverRatingsUpdate {
  id?: string;
  order_id?: string;
  driver_id?: string;
  user_id?: string;
  route_stop_id?: string;
  rating?: number;
  feedback_text?: string | null;
  submitted_at?: string;
  created_at?: string;
}

// ============================================
// WEBHOOK EVENTS (idempotency)
// ============================================

export interface WebhookEventsRow {
  id: string;
  event_id: string;
  event_type: string;
  processed_at: string;
  created_at: string;
}

export interface WebhookEventsInsert {
  id?: string;
  event_id: string;
  event_type: string;
  processed_at?: string;
  created_at?: string;
}

export interface WebhookEventsUpdate {
  id?: string;
  event_id?: string;
  event_type?: string;
  processed_at?: string;
  created_at?: string;
}

export type Database = {
  public: {
    Tables: {
      customer_settings: {
        Row: CustomerSettingsRow;
        Insert: CustomerSettingsInsert;
        Update: CustomerSettingsUpdate;
        Relationships: [
          {
            foreignKeyName: "customer_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      addresses: {
        Row: AddressesRow;
        Insert: AddressesInsert;
        Update: AddressesUpdate;
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_categories: {
        Row: MenuCategoriesRow;
        Insert: MenuCategoriesInsert;
        Update: MenuCategoriesUpdate;
        Relationships: [];
      };
      menu_items: {
        Row: MenuItemsRow;
        Insert: MenuItemsInsert;
        Update: MenuItemsUpdate;
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      modifier_groups: {
        Row: ModifierGroupsRow;
        Insert: ModifierGroupsInsert;
        Update: ModifierGroupsUpdate;
        Relationships: [];
      };
      modifier_options: {
        Row: ModifierOptionsRow;
        Insert: ModifierOptionsInsert;
        Update: ModifierOptionsUpdate;
        Relationships: [
          {
            foreignKeyName: "modifier_options_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "modifier_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      item_modifier_groups: {
        Row: ItemModifierGroupsRow;
        Insert: ItemModifierGroupsInsert;
        Update: ItemModifierGroupsUpdate;
        Relationships: [
          {
            foreignKeyName: "item_modifier_groups_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "modifier_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_modifier_groups_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: OrdersRow;
        Insert: OrdersInsert;
        Update: OrdersUpdate;
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_audit_log: {
        Row: OrderAuditLogRow;
        Insert: OrderAuditLogInsert;
        Update: OrderAuditLogUpdate;
        Relationships: [
          {
            foreignKeyName: "order_audit_log_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: OrderItemsRow;
        Insert: OrderItemsInsert;
        Update: OrderItemsUpdate;
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_item_modifiers: {
        Row: OrderItemModifiersRow;
        Insert: OrderItemModifiersInsert;
        Update: OrderItemModifiersUpdate;
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_modifier_option_id_fkey";
            columns: ["modifier_option_id"];
            isOneToOne: false;
            referencedRelation: "modifier_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_sections: {
        Row: FeaturedSectionsRow;
        Insert: FeaturedSectionsInsert;
        Update: FeaturedSectionsUpdate;
        Relationships: [
          {
            foreignKeyName: "featured_sections_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_section_items: {
        Row: FeaturedSectionItemsRow;
        Insert: FeaturedSectionItemsInsert;
        Update: FeaturedSectionItemsUpdate;
        Relationships: [
          {
            foreignKeyName: "featured_section_items_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "featured_sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "featured_section_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_invites: {
        Row: DriverInvitesRow;
        Insert: DriverInvitesInsert;
        Update: DriverInvitesUpdate;
        Relationships: [
          {
            foreignKeyName: "driver_invites_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_ratings: {
        Row: DriverRatingsRow;
        Insert: DriverRatingsInsert;
        Update: DriverRatingsUpdate;
        Relationships: [
          {
            foreignKeyName: "driver_ratings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_ratings_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_ratings_route_stop_id_fkey";
            columns: ["route_stop_id"];
            isOneToOne: false;
            referencedRelation: "route_stops";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: WebhookEventsRow;
        Insert: WebhookEventsInsert;
        Update: WebhookEventsUpdate;
        Relationships: [];
      };
    } & Record<string, GenericTable>;
    Views: Record<string, GenericView>;
    Functions: Record<string, GenericFunction>;
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
