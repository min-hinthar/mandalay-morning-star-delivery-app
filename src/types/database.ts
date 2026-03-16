export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          created_at: string;
          formatted_address: string | null;
          id: string;
          is_default: boolean;
          is_verified: boolean;
          label: string;
          lat: number | null;
          line_1: string;
          line_2: string | null;
          lng: number | null;
          postal_code: string;
          state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city: string;
          created_at?: string;
          formatted_address?: string | null;
          id?: string;
          is_default?: boolean;
          is_verified?: boolean;
          label?: string;
          lat?: number | null;
          line_1: string;
          line_2?: string | null;
          lng?: number | null;
          postal_code: string;
          state?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          formatted_address?: string | null;
          id?: string;
          is_default?: boolean;
          is_verified?: boolean;
          label?: string;
          lat?: number | null;
          line_1?: string;
          line_2?: string | null;
          lng?: number | null;
          postal_code?: string;
          state?: string;
          updated_at?: string;
          user_id?: string;
        };
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
      app_settings: {
        Row: {
          category: string;
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          category: string;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          category?: string;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_settings: {
        Row: {
          default_address: Json | null;
          delivery_instructions: string | null;
          dietary_restrictions: Json;
          notification_prefs: Json;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          default_address?: Json | null;
          delivery_instructions?: string | null;
          dietary_restrictions?: Json;
          notification_prefs?: Json;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          default_address?: Json | null;
          delivery_instructions?: string | null;
          dietary_restrictions?: Json;
          notification_prefs?: Json;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
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
      delivery_exceptions: {
        Row: {
          created_at: string;
          description: string | null;
          exception_type: Database["public"]["Enums"]["delivery_exception_type"];
          id: string;
          photo_url: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          route_stop_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          exception_type: Database["public"]["Enums"]["delivery_exception_type"];
          id?: string;
          photo_url?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          route_stop_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          exception_type?: Database["public"]["Enums"]["delivery_exception_type"];
          id?: string;
          photo_url?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          route_stop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_exceptions_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_exceptions_route_stop_id_fkey";
            columns: ["route_stop_id"];
            isOneToOne: false;
            referencedRelation: "route_stops";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_days: {
        Row: {
          id: string;
          day_of_week: number;
          is_active: boolean;
          cutoff_day: number;
          cutoff_hour: number;
          delivery_fee_cents: number;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          is_active?: boolean;
          cutoff_day: number;
          cutoff_hour: number;
          delivery_fee_cents?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_of_week?: number;
          is_active?: boolean;
          cutoff_day?: number;
          cutoff_hour?: number;
          delivery_fee_cents?: number;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      driver_badges: {
        Row: {
          badge_type: string;
          driver_id: string;
          earned_at: string;
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          badge_type: string;
          driver_id: string;
          earned_at?: string;
          icon?: string;
          id?: string;
          name: string;
        };
        Update: {
          badge_type?: string;
          driver_id?: string;
          earned_at?: string;
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_badges_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "driver_stats_mv";
            referencedColumns: ["driver_id"];
          },
          {
            foreignKeyName: "driver_badges_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_invites: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          revoked_at: string | null;
          token: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          revoked_at?: string | null;
          token?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          revoked_at?: string | null;
          token?: string | null;
        };
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
        Row: {
          created_at: string;
          driver_id: string;
          feedback_text: string | null;
          id: string;
          order_id: string;
          rating: number;
          route_stop_id: string | null;
          submitted_at: string;
        };
        Insert: {
          created_at?: string;
          driver_id: string;
          feedback_text?: string | null;
          id?: string;
          order_id: string;
          rating: number;
          route_stop_id?: string | null;
          submitted_at?: string;
        };
        Update: {
          created_at?: string;
          driver_id?: string;
          feedback_text?: string | null;
          id?: string;
          order_id?: string;
          rating?: number;
          route_stop_id?: string | null;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_ratings_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "driver_stats_mv";
            referencedColumns: ["driver_id"];
          },
          {
            foreignKeyName: "driver_ratings_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_ratings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
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
      drivers: {
        Row: {
          availability_json: Json | null;
          created_at: string;
          deliveries_count: number;
          id: string;
          is_active: boolean;
          license_plate: string | null;
          onboarding_completed_at: string | null;
          phone: string | null;
          profile_image_url: string | null;
          rating_avg: number | null;
          simple_mode: boolean;
          updated_at: string;
          user_id: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null;
        };
        Insert: {
          availability_json?: Json | null;
          created_at?: string;
          deliveries_count?: number;
          id?: string;
          is_active?: boolean;
          license_plate?: string | null;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          rating_avg?: number | null;
          simple_mode?: boolean;
          updated_at?: string;
          user_id: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null;
        };
        Update: {
          availability_json?: Json | null;
          created_at?: string;
          deliveries_count?: number;
          id?: string;
          is_active?: boolean;
          license_plate?: string | null;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          rating_avg?: number | null;
          simple_mode?: boolean;
          updated_at?: string;
          user_id?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_section_items: {
        Row: {
          item_id: string;
          section_id: string;
          sort_order: number;
        };
        Insert: {
          item_id: string;
          section_id: string;
          sort_order?: number;
        };
        Update: {
          item_id?: string;
          section_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "featured_section_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "featured_section_items_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "featured_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_sections: {
        Row: {
          accent_color: string | null;
          created_at: string;
          deleted_at: string | null;
          has_unpublished_changes: boolean;
          icon: string | null;
          id: string;
          is_predefined: boolean;
          is_visible: boolean;
          item_count: number;
          name: string;
          slug: string;
          sort_order: number;
          subtitle: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          accent_color?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          has_unpublished_changes?: boolean;
          icon?: string | null;
          id?: string;
          is_predefined?: boolean;
          is_visible?: boolean;
          item_count?: number;
          name: string;
          slug: string;
          sort_order?: number;
          subtitle?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          accent_color?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          has_unpublished_changes?: boolean;
          icon?: string | null;
          id?: string;
          is_predefined?: boolean;
          is_visible?: boolean;
          item_count?: number;
          name?: string;
          slug?: string;
          sort_order?: number;
          subtitle?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
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
      item_modifier_groups: {
        Row: {
          group_id: string;
          item_id: string;
        };
        Insert: {
          group_id: string;
          item_id: string;
        };
        Update: {
          group_id?: string;
          item_id?: string;
        };
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
      location_updates: {
        Row: {
          accuracy: number | null;
          created_at: string;
          driver_id: string;
          heading: number | null;
          id: string;
          latitude: number;
          longitude: number;
          recorded_at: string;
          route_id: string | null;
          source: string | null;
          speed: number | null;
        };
        Insert: {
          accuracy?: number | null;
          created_at?: string;
          driver_id: string;
          heading?: number | null;
          id?: string;
          latitude: number;
          longitude: number;
          recorded_at?: string;
          route_id?: string | null;
          source?: string | null;
          speed?: number | null;
        };
        Update: {
          accuracy?: number | null;
          created_at?: string;
          driver_id?: string;
          heading?: number | null;
          id?: string;
          latitude?: number;
          longitude?: number;
          recorded_at?: string;
          route_id?: string | null;
          source?: string | null;
          speed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "location_updates_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "driver_stats_mv";
            referencedColumns: ["driver_id"];
          },
          {
            foreignKeyName: "location_updates_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "location_updates_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          allergens: string[];
          base_price_cents: number;
          category_id: string;
          created_at: string;
          description_en: string | null;
          id: string;
          image_updated_at: string | null;
          image_url: string | null;
          is_active: boolean;
          is_sold_out: boolean;
          name_en: string;
          name_my: string | null;
          slug: string;
          tags: string[];
          updated_at: string;
        };
        Insert: {
          allergens?: string[];
          base_price_cents: number;
          category_id: string;
          created_at?: string;
          description_en?: string | null;
          id?: string;
          image_updated_at?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          is_sold_out?: boolean;
          name_en: string;
          name_my?: string | null;
          slug: string;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          allergens?: string[];
          base_price_cents?: number;
          category_id?: string;
          created_at?: string;
          description_en?: string | null;
          id?: string;
          image_updated_at?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          is_sold_out?: boolean;
          name_en?: string;
          name_my?: string | null;
          slug?: string;
          tags?: string[];
          updated_at?: string;
        };
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
        Row: {
          created_at: string;
          id: string;
          max_select: number;
          min_select: number;
          name: string;
          selection_type: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          max_select?: number;
          min_select?: number;
          name: string;
          selection_type?: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          max_select?: number;
          min_select?: number;
          name?: string;
          selection_type?: string;
          slug?: string;
        };
        Relationships: [];
      };
      modifier_options: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          is_active: boolean;
          name: string;
          price_delta_cents: number;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          price_delta_cents?: number;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          price_delta_cents?: number;
          slug?: string;
          sort_order?: number;
        };
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
      notification_logs: {
        Row: {
          channel: string;
          created_at: string;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          notification_type: Database["public"]["Enums"]["notification_type"];
          order_id: string | null;
          recipient: string;
          resend_id: string | null;
          retry_count: number | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          subject: string | null;
          user_id: string | null;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          notification_type: Database["public"]["Enums"]["notification_type"];
          order_id?: string | null;
          recipient: string;
          resend_id?: string | null;
          retry_count?: number | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          subject?: string | null;
          user_id?: string | null;
        };
        Update: {
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          notification_type?: Database["public"]["Enums"]["notification_type"];
          order_id?: string | null;
          recipient?: string;
          resend_id?: string | null;
          retry_count?: number | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          subject?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_audit_log: {
        Row: {
          action: string;
          actor_id: string;
          actor_role: string;
          created_at: string;
          id: string;
          new_value: Json | null;
          old_value: Json | null;
          order_id: string;
          reason: string | null;
        };
        Insert: {
          action: string;
          actor_id: string;
          actor_role: string;
          created_at?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          order_id: string;
          reason?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string;
          actor_role?: string;
          created_at?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          order_id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_audit_log_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_item_modifiers: {
        Row: {
          created_at: string;
          id: string;
          modifier_option_id: string | null;
          name_snapshot: string;
          order_item_id: string;
          price_delta_snapshot: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          modifier_option_id?: string | null;
          name_snapshot: string;
          order_item_id: string;
          price_delta_snapshot?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          modifier_option_id?: string | null;
          name_snapshot?: string;
          order_item_id?: string;
          price_delta_snapshot?: number;
        };
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
      order_items: {
        Row: {
          base_price_snapshot: number;
          created_at: string;
          id: string;
          line_total_cents: number;
          menu_item_id: string | null;
          name_my_snapshot: string | null;
          name_snapshot: string;
          order_id: string;
          quantity: number;
          refunded_quantity: number | null;
          special_instructions: string | null;
        };
        Insert: {
          base_price_snapshot: number;
          created_at?: string;
          id?: string;
          line_total_cents: number;
          menu_item_id?: string | null;
          name_my_snapshot?: string | null;
          name_snapshot: string;
          order_id: string;
          quantity?: number;
          refunded_quantity?: number | null;
          special_instructions?: string | null;
        };
        Update: {
          base_price_snapshot?: number;
          created_at?: string;
          id?: string;
          line_total_cents?: number;
          menu_item_id?: string | null;
          name_my_snapshot?: string | null;
          name_snapshot?: string;
          order_id?: string;
          quantity?: number;
          refunded_quantity?: number | null;
          special_instructions?: string | null;
        };
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
      orders: {
        Row: {
          address_id: string | null;
          assigned_driver_id: string | null;
          confirmed_at: string | null;
          contacted_at: string | null;
          contacted_by: string | null;
          created_at: string;
          delivered_at: string | null;
          delivery_fee_cents: number;
          delivery_instructions: string | null;
          delivery_window_end: string | null;
          delivery_window_start: string | null;
          discount_cents: number;
          id: string;
          is_priority: boolean | null;
          needs_contact: boolean | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          cod_approved_at: string | null;
          cod_approved_by: string | null;
          placed_at: string;
          promo_code: string | null;
          rating_dismissed: boolean;
          refund_status: string;
          share_token: string | null;
          special_instructions: string | null;
          status: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          subtotal_cents: number;
          tax_cents: number;
          tip_cents: number;
          total_cents: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_id?: string | null;
          assigned_driver_id?: string | null;
          confirmed_at?: string | null;
          contacted_at?: string | null;
          contacted_by?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_fee_cents?: number;
          delivery_instructions?: string | null;
          delivery_window_end?: string | null;
          delivery_window_start?: string | null;
          discount_cents?: number;
          id?: string;
          is_priority?: boolean | null;
          needs_contact?: boolean | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          cod_approved_at?: string | null;
          cod_approved_by?: string | null;
          placed_at?: string;
          promo_code?: string | null;
          rating_dismissed?: boolean;
          refund_status?: string;
          share_token?: string | null;
          special_instructions?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          subtotal_cents: number;
          tax_cents?: number;
          tip_cents?: number;
          total_cents: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_id?: string | null;
          assigned_driver_id?: string | null;
          confirmed_at?: string | null;
          contacted_at?: string | null;
          contacted_by?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_fee_cents?: number;
          delivery_instructions?: string | null;
          delivery_window_end?: string | null;
          delivery_window_start?: string | null;
          discount_cents?: number;
          id?: string;
          is_priority?: boolean | null;
          needs_contact?: boolean | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          cod_approved_at?: string | null;
          cod_approved_by?: string | null;
          placed_at?: string;
          promo_code?: string | null;
          rating_dismissed?: boolean;
          refund_status?: string;
          share_token?: string | null;
          special_instructions?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          subtotal_cents?: number;
          tax_cents?: number;
          tip_cents?: number;
          total_cents?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_assigned_driver_id_fkey";
            columns: ["assigned_driver_id"];
            isOneToOne: false;
            referencedRelation: "driver_stats_mv";
            referencedColumns: ["driver_id"];
          },
          {
            foreignKeyName: "orders_assigned_driver_id_fkey";
            columns: ["assigned_driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_contacted_by_fkey";
            columns: ["contacted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      route_stops: {
        Row: {
          arrived_at: string | null;
          created_at: string;
          delivered_at: string | null;
          delivery_notes: string | null;
          delivery_photo_url: string | null;
          eta: string | null;
          id: string;
          order_id: string;
          route_id: string;
          status: Database["public"]["Enums"]["route_stop_status"];
          stop_index: number;
          updated_at: string;
        };
        Insert: {
          arrived_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_notes?: string | null;
          delivery_photo_url?: string | null;
          eta?: string | null;
          id?: string;
          order_id: string;
          route_id: string;
          status?: Database["public"]["Enums"]["route_stop_status"];
          stop_index: number;
          updated_at?: string;
        };
        Update: {
          arrived_at?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_notes?: string | null;
          delivery_photo_url?: string | null;
          eta?: string | null;
          id?: string;
          order_id?: string;
          route_id?: string;
          status?: Database["public"]["Enums"]["route_stop_status"];
          stop_index?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "route_stops_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "route_stops_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          completed_at: string | null;
          created_at: string;
          delivery_date: string;
          driver_id: string | null;
          id: string;
          optimized_polyline: string | null;
          started_at: string | null;
          stats_json: Json | null;
          status: Database["public"]["Enums"]["route_status"];
          accepted_at: string | null;
          declined_at: string | null;
          declined_reason: string | null;
          declined_by: string | null;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          delivery_date: string;
          driver_id?: string | null;
          id?: string;
          optimized_polyline?: string | null;
          started_at?: string | null;
          stats_json?: Json | null;
          status?: Database["public"]["Enums"]["route_status"];
          accepted_at?: string | null;
          declined_at?: string | null;
          declined_reason?: string | null;
          declined_by?: string | null;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          delivery_date?: string;
          driver_id?: string | null;
          id?: string;
          optimized_polyline?: string | null;
          started_at?: string | null;
          stats_json?: Json | null;
          status?: Database["public"]["Enums"]["route_status"];
          accepted_at?: string | null;
          declined_at?: string | null;
          declined_reason?: string | null;
          declined_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routes_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "driver_stats_mv";
            referencedColumns: ["driver_id"];
          },
          {
            foreignKeyName: "routes_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_audit_logs: {
        Row: {
          created_at: string;
          error_message: string | null;
          event_type: string;
          id: string;
          payload_hash: string;
          processed_at: string;
          signature_valid: boolean;
          source_ip: string | null;
          svix_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          event_type: string;
          id?: string;
          payload_hash: string;
          processed_at?: string;
          signature_valid: boolean;
          source_ip?: string | null;
          svix_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          payload_hash?: string;
          processed_at?: string;
          signature_valid?: boolean;
          source_ip?: string | null;
          svix_id?: string | null;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          created_at: string;
          event_id: string;
          event_type: string;
          id: string;
          processed_at: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          event_type: string;
          id?: string;
          processed_at?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          event_type?: string;
          id?: string;
          processed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      delivery_metrics_mv: {
        Row: {
          active_drivers: number | null;
          avg_order_cents: number | null;
          avg_route_duration_minutes: number | null;
          delivered_count: number | null;
          delivery_date: string | null;
          delivery_success_rate: number | null;
          eta_accuracy_rate: number | null;
          skipped_count: number | null;
          total_exceptions: number | null;
          total_orders: number | null;
          total_revenue_cents: number | null;
          total_routes: number | null;
          total_stops: number | null;
        };
        Relationships: [];
      };
      driver_stats_mv: {
        Row: {
          avg_delivery_minutes: number | null;
          avg_rating: number | null;
          deliveries_last_30_days: number | null;
          deliveries_last_7_days: number | null;
          driver_id: string | null;
          driver_since: string | null;
          email: string | null;
          exceptions_access: number | null;
          exceptions_damaged: number | null;
          exceptions_not_home: number | null;
          exceptions_refused: number | null;
          exceptions_wrong_address: number | null;
          full_name: string | null;
          is_active: boolean | null;
          last_route_completed: string | null;
          on_time_rate: number | null;
          profile_image_url: string | null;
          ratings_1_star: number | null;
          ratings_2_star: number | null;
          ratings_3_star: number | null;
          ratings_4_star: number | null;
          ratings_5_star: number | null;
          total_deliveries: number | null;
          total_exceptions: number | null;
          total_ratings: number | null;
          user_id: string | null;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null;
          fk_constraint_name: unknown;
          fk_schema_name: unknown;
          fk_table_name: unknown;
          fk_table_oid: unknown;
          is_deferrable: boolean | null;
          is_deferred: boolean | null;
          match_type: string | null;
          on_delete: string | null;
          on_update: string | null;
          pk_columns: unknown[] | null;
          pk_constraint_name: unknown;
          pk_index_name: unknown;
          pk_schema_name: unknown;
          pk_table_name: unknown;
          pk_table_oid: unknown;
        };
        Relationships: [];
      };
      tap_funky: {
        Row: {
          args: string | null;
          is_definer: boolean | null;
          is_strict: boolean | null;
          is_visible: boolean | null;
          kind: unknown;
          langoid: unknown;
          name: unknown;
          oid: unknown;
          owner: unknown;
          returns: string | null;
          returns_set: boolean | null;
          schema: unknown;
          volatility: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      __plpgsql_show_dependency_tb:
        | {
            Args: {
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              funcoid: unknown;
              relid?: unknown;
            };
            Returns: {
              name: string;
              oid: unknown;
              params: string;
              schema: string;
              type: string;
            }[];
          }
        | {
            Args: {
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              name: string;
              relid?: unknown;
            };
            Returns: {
              name: string;
              oid: unknown;
              params: string;
              schema: string;
              type: string;
            }[];
          };
      _cleanup: { Args: never; Returns: boolean };
      _contract_on: { Args: { "": string }; Returns: unknown };
      _currtest: { Args: never; Returns: number };
      _db_privs: { Args: never; Returns: unknown[] };
      _extensions: { Args: never; Returns: unknown[] };
      _get: { Args: { "": string }; Returns: number };
      _get_latest: { Args: { "": string }; Returns: number[] };
      _get_note: { Args: { "": string }; Returns: string };
      _is_verbose: { Args: never; Returns: boolean };
      _prokind: { Args: { p_oid: unknown }; Returns: unknown };
      _query: { Args: { "": string }; Returns: string };
      _refine_vol: { Args: { "": string }; Returns: string };
      _table_privs: { Args: never; Returns: unknown[] };
      _temptypes: { Args: { "": string }; Returns: string };
      _todo: { Args: never; Returns: string };
      batch_update_stop_indices: {
        Args: { p_stop_ids: string[]; p_indices: number[] };
        Returns: undefined;
      };
      calculate_driver_streak: {
        Args: { p_driver_id: string };
        Returns: number;
      };
      calculate_driver_weekly_deliveries: {
        Args: { p_driver_id: string };
        Returns: number;
      };
      calculate_route_stats: { Args: { p_route_id: string }; Returns: Json };
      col_is_null:
        | {
            Args: {
              column_name: unknown;
              description?: string;
              schema_name: unknown;
              table_name: unknown;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: unknown;
              description?: string;
              table_name: unknown;
            };
            Returns: string;
          };
      col_not_null:
        | {
            Args: {
              column_name: unknown;
              description?: string;
              schema_name: unknown;
              table_name: unknown;
            };
            Returns: string;
          }
        | {
            Args: {
              column_name: unknown;
              description?: string;
              table_name: unknown;
            };
            Returns: string;
          };
      apply_item_refunds: {
        Args: { p_order_id: string; p_items: Json; p_refund_shipping: boolean };
        Returns: Json;
      };
      create_order_with_items: {
        Args: { p_items: Json; p_modifiers?: Json; p_order: Json };
        Returns: Json;
      };
      delivery_date: { Args: { ts: string }; Returns: string };
      diag:
        | {
            Args: { msg: unknown };
            Returns: {
              error: true;
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved";
          }
        | {
            Args: { msg: string };
            Returns: {
              error: true;
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved";
          };
      diag_test_name: { Args: { "": string }; Returns: string };
      do_tap: { Args: never; Returns: string[] } | { Args: { "": string }; Returns: string[] };
      fail: { Args: never; Returns: string } | { Args: { "": string }; Returns: string };
      findfuncs: { Args: { "": string }; Returns: string[] };
      finish: { Args: { exception_on_failure?: boolean }; Returns: string[] };
      get_delivery_metrics_admin: {
        Args: never;
        Returns: {
          active_drivers: number | null;
          avg_order_cents: number | null;
          avg_route_duration_minutes: number | null;
          delivered_count: number | null;
          delivery_date: string | null;
          delivery_success_rate: number | null;
          eta_accuracy_rate: number | null;
          skipped_count: number | null;
          total_exceptions: number | null;
          total_orders: number | null;
          total_revenue_cents: number | null;
          total_routes: number | null;
          total_stops: number | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "delivery_metrics_mv";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_driver_latest_location: {
        Args: { p_driver_id: string };
        Returns: {
          accuracy: number;
          latitude: number;
          longitude: number;
          recorded_at: string;
        }[];
      };
      get_driver_performance: {
        Args: { p_driver_id: string };
        Returns: {
          avg_rating: number;
          deliveries_last_30_days: number;
          deliveries_last_7_days: number;
          on_time_rate: number;
          total_deliveries: number;
          total_exceptions: number;
          total_ratings: number;
        }[];
      };
      increment_driver_deliveries: {
        Args: { p_driver_id: string; p_count: number };
        Returns: undefined;
      };
      get_driver_stats_admin: {
        Args: never;
        Returns: {
          avg_delivery_minutes: number | null;
          avg_rating: number | null;
          deliveries_last_30_days: number | null;
          deliveries_last_7_days: number | null;
          driver_id: string | null;
          driver_since: string | null;
          email: string | null;
          exceptions_access: number | null;
          exceptions_damaged: number | null;
          exceptions_not_home: number | null;
          exceptions_refused: number | null;
          exceptions_wrong_address: number | null;
          full_name: string | null;
          is_active: boolean | null;
          last_route_completed: string | null;
          on_time_rate: number | null;
          profile_image_url: string | null;
          ratings_1_star: number | null;
          ratings_2_star: number | null;
          ratings_3_star: number | null;
          ratings_4_star: number | null;
          ratings_5_star: number | null;
          total_deliveries: number | null;
          total_exceptions: number | null;
          total_ratings: number | null;
          user_id: string | null;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "driver_stats_mv";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_my_driver_id: { Args: never; Returns: string };
      has_unique: { Args: { "": string }; Returns: string };
      in_todo: { Args: never; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      is_driver: { Args: never; Returns: boolean };
      is_empty: { Args: { "": string }; Returns: string };
      isnt_empty: { Args: { "": string }; Returns: string };
      lives_ok: { Args: { "": string }; Returns: string };
      no_plan: { Args: never; Returns: boolean[] };
      num_failed: { Args: never; Returns: number };
      os_name: { Args: never; Returns: string };
      pass: { Args: never; Returns: string } | { Args: { "": string }; Returns: string };
      pg_version: { Args: never; Returns: string };
      pg_version_num: { Args: never; Returns: number };
      pgtap_version: { Args: never; Returns: number };
      plpgsql_check_function:
        | {
            Args: {
              all_warnings?: boolean;
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              compatibility_warnings?: boolean;
              constant_tracing?: boolean;
              extra_warnings?: boolean;
              fatal_errors?: boolean;
              format?: string;
              funcoid: unknown;
              incomment_options_usage_warning?: boolean;
              newtable?: unknown;
              oldtable?: unknown;
              other_warnings?: boolean;
              performance_warnings?: boolean;
              relid?: unknown;
              security_warnings?: boolean;
              use_incomment_options?: boolean;
              without_warnings?: boolean;
            };
            Returns: string[];
          }
        | {
            Args: {
              all_warnings?: boolean;
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              compatibility_warnings?: boolean;
              constant_tracing?: boolean;
              extra_warnings?: boolean;
              fatal_errors?: boolean;
              format?: string;
              incomment_options_usage_warning?: boolean;
              name: string;
              newtable?: unknown;
              oldtable?: unknown;
              other_warnings?: boolean;
              performance_warnings?: boolean;
              relid?: unknown;
              security_warnings?: boolean;
              use_incomment_options?: boolean;
              without_warnings?: boolean;
            };
            Returns: string[];
          };
      plpgsql_check_function_tb:
        | {
            Args: {
              all_warnings?: boolean;
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              compatibility_warnings?: boolean;
              constant_tracing?: boolean;
              extra_warnings?: boolean;
              fatal_errors?: boolean;
              funcoid: unknown;
              incomment_options_usage_warning?: boolean;
              newtable?: unknown;
              oldtable?: unknown;
              other_warnings?: boolean;
              performance_warnings?: boolean;
              relid?: unknown;
              security_warnings?: boolean;
              use_incomment_options?: boolean;
              without_warnings?: boolean;
            };
            Returns: {
              context: string;
              detail: string;
              functionid: unknown;
              hint: string;
              level: string;
              lineno: number;
              message: string;
              position: number;
              query: string;
              sqlstate: string;
              statement: string;
            }[];
          }
        | {
            Args: {
              all_warnings?: boolean;
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              compatibility_warnings?: boolean;
              constant_tracing?: boolean;
              extra_warnings?: boolean;
              fatal_errors?: boolean;
              incomment_options_usage_warning?: boolean;
              name: string;
              newtable?: unknown;
              oldtable?: unknown;
              other_warnings?: boolean;
              performance_warnings?: boolean;
              relid?: unknown;
              security_warnings?: boolean;
              use_incomment_options?: boolean;
              without_warnings?: boolean;
            };
            Returns: {
              context: string;
              detail: string;
              functionid: unknown;
              hint: string;
              level: string;
              lineno: number;
              message: string;
              position: number;
              query: string;
              sqlstate: string;
              statement: string;
            }[];
          };
      plpgsql_check_pragma: { Args: { name: string[] }; Returns: number };
      plpgsql_check_profiler: { Args: { enable?: boolean }; Returns: boolean };
      plpgsql_check_tracer: {
        Args: { enable?: boolean; verbosity?: string };
        Returns: boolean;
      };
      plpgsql_coverage_branches:
        | { Args: { funcoid: unknown }; Returns: number }
        | { Args: { name: string }; Returns: number };
      plpgsql_coverage_statements:
        | { Args: { funcoid: unknown }; Returns: number }
        | { Args: { name: string }; Returns: number };
      plpgsql_profiler_function_statements_tb:
        | {
            Args: { funcoid: unknown };
            Returns: {
              avg_time: number;
              block_num: number;
              exec_stmts: number;
              exec_stmts_err: number;
              lineno: number;
              max_time: number;
              parent_note: string;
              parent_stmtid: number;
              processed_rows: number;
              queryid: number;
              stmtid: number;
              stmtname: string;
              total_time: number;
            }[];
          }
        | {
            Args: { name: string };
            Returns: {
              avg_time: number;
              block_num: number;
              exec_stmts: number;
              exec_stmts_err: number;
              lineno: number;
              max_time: number;
              parent_note: string;
              parent_stmtid: number;
              processed_rows: number;
              queryid: number;
              stmtid: number;
              stmtname: string;
              total_time: number;
            }[];
          };
      plpgsql_profiler_function_tb:
        | {
            Args: { funcoid: unknown };
            Returns: {
              avg_time: number;
              cmds_on_row: number;
              exec_stmts: number;
              exec_stmts_err: number;
              lineno: number;
              max_time: number[];
              processed_rows: number[];
              queryids: number[];
              source: string;
              stmt_lineno: number;
              total_time: number;
            }[];
          }
        | {
            Args: { name: string };
            Returns: {
              avg_time: number;
              cmds_on_row: number;
              exec_stmts: number;
              exec_stmts_err: number;
              lineno: number;
              max_time: number[];
              processed_rows: number[];
              queryids: number[];
              source: string;
              stmt_lineno: number;
              total_time: number;
            }[];
          };
      plpgsql_profiler_functions_all: {
        Args: never;
        Returns: {
          avg_time: number;
          exec_count: number;
          exec_stmts_err: number;
          funcoid: unknown;
          max_time: number;
          min_time: number;
          stddev_time: number;
          total_time: number;
        }[];
      };
      plpgsql_profiler_install_fake_queryid_hook: {
        Args: never;
        Returns: undefined;
      };
      plpgsql_profiler_remove_fake_queryid_hook: {
        Args: never;
        Returns: undefined;
      };
      plpgsql_profiler_reset: { Args: { funcoid: unknown }; Returns: undefined };
      plpgsql_profiler_reset_all: { Args: never; Returns: undefined };
      plpgsql_show_dependency_tb:
        | {
            Args: {
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              fnname: string;
              relid?: unknown;
            };
            Returns: {
              name: string;
              oid: unknown;
              params: string;
              schema: string;
              type: string;
            }[];
          }
        | {
            Args: {
              anycompatiblerangetype?: unknown;
              anycompatibletype?: unknown;
              anyelememttype?: unknown;
              anyenumtype?: unknown;
              anyrangetype?: unknown;
              funcoid: unknown;
              relid?: unknown;
            };
            Returns: {
              name: string;
              oid: unknown;
              params: string;
              schema: string;
              type: string;
            }[];
          };
      reindex_route_stops: {
        Args: { p_route_id: string };
        Returns: undefined;
      };
      refresh_analytics_views: { Args: never; Returns: undefined };
      runtests: { Args: never; Returns: string[] } | { Args: { "": string }; Returns: string[] };
      skip:
        | { Args: { "": string }; Returns: string }
        | { Args: { how_many: number; why: string }; Returns: string };
      throws_ok: { Args: { "": string }; Returns: string };
      todo:
        | { Args: { how_many: number }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
        | { Args: { why: string }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] };
      todo_end: { Args: never; Returns: boolean[] };
      todo_start:
        | { Args: never; Returns: boolean[] }
        | { Args: { "": string }; Returns: boolean[] };
      update_route_stats: {
        Args: { p_route_id: string };
        Returns: Json;
      };
      split_route: {
        Args: {
          p_source_route_id: string;
          p_stop_ids: string[];
          p_new_driver_id?: string;
        };
        Returns: string;
      };
      merge_routes: {
        Args: {
          p_destination_route_id: string;
          p_source_route_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      delivery_exception_type:
        | "customer_not_home"
        | "wrong_address"
        | "access_issue"
        | "refused_delivery"
        | "damaged_order"
        | "other";
      notification_status:
        | "pending"
        | "sent"
        | "delivered"
        | "failed"
        | "bounced"
        | "opened"
        | "clicked";
      notification_type:
        | "order_confirmation"
        | "out_for_delivery"
        | "arriving_soon"
        | "delivered"
        | "feedback_request"
        | "cancellation"
        | "refund"
        | "delivery_reminder";
      order_status:
        | "pending_approval"
        | "pending"
        | "confirmed"
        | "preparing"
        | "out_for_delivery"
        | "delivered"
        | "cancelled";
      payment_method: "stripe" | "cod";
      route_status: "planned" | "assigned" | "accepted" | "in_progress" | "completed";
      route_stop_status: "pending" | "enroute" | "arrived" | "delivered" | "skipped";
      vehicle_type: "car" | "motorcycle" | "bicycle" | "van" | "truck";
    };
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      delivery_exception_type: [
        "customer_not_home",
        "wrong_address",
        "access_issue",
        "refused_delivery",
        "damaged_order",
        "other",
      ],
      notification_status: [
        "pending",
        "sent",
        "delivered",
        "failed",
        "bounced",
        "opened",
        "clicked",
      ],
      notification_type: [
        "order_confirmation",
        "out_for_delivery",
        "arriving_soon",
        "delivered",
        "feedback_request",
        "cancellation",
        "refund",
        "delivery_reminder",
      ],
      order_status: [
        "pending_approval",
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      payment_method: ["stripe", "cod"],
      route_status: ["planned", "assigned", "accepted", "in_progress", "completed"],
      route_stop_status: ["pending", "enroute", "arrived", "delivered", "skipped"],
      vehicle_type: ["car", "motorcycle", "bicycle", "van", "truck"],
    },
  },
} as const;

// =============================================================================
// BACKWARD-COMPATIBLE TYPE ALIASES
// These re-export types from the generated Database type so existing imports
// like `import type { OrdersRow, OrderStatus } from "@/types/database"` work.
// =============================================================================

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
