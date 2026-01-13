export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          street_address: string
          city: string
          state: string
          zip_code: string
          lat: number | null
          lng: number | null
          is_default: boolean
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          street_address: string
          city: string
          state?: string
          zip_code: string
          lat?: number | null
          lng?: number | null
          is_default?: boolean
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          street_address?: string
          city?: string
          state?: string
          zip_code?: string
          lat?: number | null
          lng?: number | null
          is_default?: boolean
          is_verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_modifier_groups: {
        Row: {
          item_id: string
          group_id: string
        }
        Insert: {
          item_id: string
          group_id: string
        }
        Update: {
          item_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_modifier_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_modifier_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          id: string
          slug: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          slug: string
          name_en: string
          name_my: string | null
          description_en: string | null
          base_price_cents: number
          image_url: string | null
          is_active: boolean
          is_sold_out: boolean
          allergens: string[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          slug: string
          name_en: string
          name_my?: string | null
          description_en?: string | null
          base_price_cents: number
          image_url?: string | null
          is_active?: boolean
          is_sold_out?: boolean
          allergens?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          slug?: string
          name_en?: string
          name_my?: string | null
          description_en?: string | null
          base_price_cents?: number
          image_url?: string | null
          is_active?: boolean
          is_sold_out?: boolean
          allergens?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          id: string
          slug: string
          name: string
          selection_type: string
          min_select: number
          max_select: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          selection_type?: string
          min_select?: number
          max_select?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          selection_type?: string
          min_select?: number
          max_select?: number
          created_at?: string
        }
        Relationships: []
      }
      modifier_options: {
        Row: {
          id: string
          group_id: string
          slug: string
          name: string
          price_delta_cents: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          slug: string
          name: string
          price_delta_cents?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          slug?: string
          name?: string
          price_delta_cents?: number
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          order_item_id: string
          modifier_option_id: string | null
          name_snapshot: string
          price_delta_snapshot: number
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          modifier_option_id?: string | null
          name_snapshot: string
          price_delta_snapshot?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_item_id?: string
          modifier_option_id?: string | null
          name_snapshot?: string
          price_delta_snapshot?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_modifier_option_id_fkey"
            columns: ["modifier_option_id"]
            isOneToOne: false
            referencedRelation: "modifier_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          name_snapshot: string
          base_price_snapshot: number
          quantity: number
          line_total_cents: number
          special_instructions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id?: string | null
          name_snapshot: string
          base_price_snapshot: number
          quantity?: number
          line_total_cents: number
          special_instructions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string | null
          name_snapshot?: string
          base_price_snapshot?: number
          quantity?: number
          line_total_cents?: number
          special_instructions?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          address_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          delivery_fee_cents: number
          tax_cents: number
          total_cents: number
          delivery_window_start: string | null
          delivery_window_end: string | null
          special_instructions: string | null
          stripe_payment_intent_id: string | null
          placed_at: string
          confirmed_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          delivery_fee_cents?: number
          tax_cents?: number
          total_cents: number
          delivery_window_start?: string | null
          delivery_window_end?: string | null
          special_instructions?: string | null
          stripe_payment_intent_id?: string | null
          placed_at?: string
          confirmed_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          delivery_fee_cents?: number
          tax_cents?: number
          total_cents?: number
          delivery_window_start?: string | null
          delivery_window_end?: string | null
          special_instructions?: string | null
          stripe_payment_intent_id?: string | null
          placed_at?: string
          confirmed_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer Row
      }
      ? Row
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer Insert
    }
    ? Insert
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer Insert
      }
      ? Insert
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer Update
    }
    ? Update
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer Update
      }
      ? Update
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
