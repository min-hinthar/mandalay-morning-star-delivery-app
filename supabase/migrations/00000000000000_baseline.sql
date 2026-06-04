-- =============================================================================
-- BASELINE — single live-schema baseline (Mandalay Morning Star delivery app)
-- Project ref: ukuzkhuppqwtrdkjqrkv
--
-- Reconstructed from the LIVE production schema via catalog introspection and
-- committed as the squash baseline. Replaces the two prior entangled migration
-- lineages (see migrations_archive/). History hygiene only — this reflects the
-- schema that is ALREADY live; it makes no change to production.
-- =============================================================================

SET statement_timeout = 0;
SET client_min_messages = warning;
SET check_function_bodies = off;
SET search_path = public, extensions;

-- Extensions ------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
-- Test/diagnostic extensions live in public on prod and surface in generated
-- types; recreate them so `supabase gen types` matches the live schema.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS plpgsql_check WITH SCHEMA public;

-- Enum types ------------------------------------------------------------------
CREATE TYPE delivery_exception_type AS ENUM ('customer_not_home','wrong_address','access_issue','refused_delivery','damaged_order','other');
CREATE TYPE feedback_category AS ENUM ('bug_report','order_issue','suggestion','general');
CREATE TYPE feedback_status AS ENUM ('new','in_review','resolved','dismissed');
CREATE TYPE notification_status AS ENUM ('pending','sent','delivered','failed','bounced','opened','clicked');
CREATE TYPE notification_type AS ENUM ('order_confirmation','out_for_delivery','arriving_soon','delivered','feedback_request','cancellation','refund','delivery_reminder');
CREATE TYPE order_status AS ENUM ('pending_approval','pending','confirmed','preparing','out_for_delivery','delivered','cancelled');
CREATE TYPE route_status AS ENUM ('planned','in_progress','completed','assigned','accepted');
CREATE TYPE route_stop_status AS ENUM ('pending','enroute','arrived','delivered','skipped');
CREATE TYPE vehicle_type AS ENUM ('car','motorcycle','bicycle','van','truck');

-- Tables ----------------------------------------------------------------------
CREATE TABLE addresses (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    label text NOT NULL DEFAULT 'Home'::text,
    line_1 text NOT NULL,
    line_2 text,
    city text NOT NULL,
    state text NOT NULL DEFAULT 'CA'::text,
    postal_code text NOT NULL,
    formatted_address text,
    lat double precision,
    lng double precision,
    is_default boolean NOT NULL DEFAULT false,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    distance_miles double precision,
    CONSTRAINT addresses_pkey PRIMARY KEY (id)
);

CREATE TABLE app_settings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    key text NOT NULL,
    value jsonb NOT NULL,
    category text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    CONSTRAINT app_settings_pkey PRIMARY KEY (id),
    CONSTRAINT app_settings_key_key UNIQUE (key),
    CONSTRAINT app_settings_category_check CHECK ((category = ANY (ARRAY['delivery'::text, 'operations'::text, 'notifications'::text])))
);

CREATE TABLE carts (
    user_id uuid NOT NULL,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    subtotal_cents integer NOT NULL DEFAULT 0,
    item_count integer NOT NULL DEFAULT 0,
    reminded_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT carts_pkey PRIMARY KEY (user_id),
    CONSTRAINT carts_item_count_check CHECK ((item_count >= 0)),
    CONSTRAINT carts_subtotal_cents_check CHECK ((subtotal_cents >= 0))
);

CREATE TABLE customer_feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    contact_email text,
    category feedback_category NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    order_id uuid,
    page_url text,
    user_agent text,
    sentry_event_id text,
    screenshot_url text,
    screenshot_path text,
    status feedback_status NOT NULL DEFAULT 'new'::feedback_status,
    admin_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT customer_feedback_pkey PRIMARY KEY (id)
);

CREATE TABLE customer_settings (
    user_id uuid NOT NULL,
    dietary_restrictions jsonb NOT NULL DEFAULT '[]'::jsonb,
    delivery_instructions text DEFAULT ''::text,
    default_address jsonb,
    notification_prefs jsonb NOT NULL DEFAULT '{"marketing": true, "reminders": true, "order_updates": true}'::jsonb,
    theme text DEFAULT 'system'::text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT customer_settings_pkey PRIMARY KEY (user_id)
);

CREATE TABLE delivery_days (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    day_of_week integer NOT NULL,
    is_active boolean NOT NULL DEFAULT false,
    cutoff_day integer NOT NULL,
    cutoff_hour integer NOT NULL DEFAULT 15,
    delivery_fee_cents integer NOT NULL DEFAULT 1500,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    direction text NOT NULL DEFAULT 'all'::text,
    CONSTRAINT delivery_days_pkey PRIMARY KEY (id),
    CONSTRAINT delivery_days_day_of_week_key UNIQUE (day_of_week),
    CONSTRAINT delivery_days_cutoff_day_check CHECK (((cutoff_day >= 0) AND (cutoff_day <= 6))),
    CONSTRAINT delivery_days_cutoff_hour_check CHECK (((cutoff_hour >= 0) AND (cutoff_hour <= 23))),
    CONSTRAINT delivery_days_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT delivery_days_delivery_fee_cents_check CHECK ((delivery_fee_cents >= 0)),
    CONSTRAINT delivery_days_direction_check CHECK ((direction = ANY (ARRAY['east'::text, 'west'::text, 'south'::text, 'all'::text])))
);

CREATE TABLE delivery_exceptions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    route_stop_id uuid NOT NULL,
    exception_type delivery_exception_type NOT NULL,
    description text,
    photo_url text,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT delivery_exceptions_pkey PRIMARY KEY (id)
);

CREATE TABLE delivery_zones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    direction text NOT NULL,
    bearing_start double precision NOT NULL,
    bearing_end double precision NOT NULL,
    reference_cities text[] NOT NULL DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT delivery_zones_pkey PRIMARY KEY (id),
    CONSTRAINT delivery_zones_direction_key UNIQUE (direction),
    CONSTRAINT delivery_zones_direction_check CHECK ((direction = ANY (ARRAY['east'::text, 'west'::text, 'south'::text])))
);

CREATE TABLE driver_badges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    driver_id uuid NOT NULL,
    badge_type text NOT NULL,
    name text NOT NULL,
    icon text NOT NULL DEFAULT 'star'::text,
    earned_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT driver_badges_pkey PRIMARY KEY (id),
    CONSTRAINT driver_badges_driver_id_badge_type_key UNIQUE (driver_id, badge_type)
);

CREATE TABLE driver_invites (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    token text,
    invited_by uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT driver_invites_pkey PRIMARY KEY (id)
);

CREATE TABLE driver_ratings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    driver_id uuid NOT NULL,
    order_id uuid NOT NULL,
    route_stop_id uuid,
    rating integer NOT NULL,
    feedback_text text,
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT driver_ratings_pkey PRIMARY KEY (id),
    CONSTRAINT driver_ratings_order_id_key UNIQUE (order_id),
    CONSTRAINT driver_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

CREATE TABLE drivers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    vehicle_type vehicle_type,
    license_plate text,
    phone text,
    profile_image_url text,
    is_active boolean NOT NULL DEFAULT true,
    onboarding_completed_at timestamp with time zone,
    rating_avg numeric(3,2) DEFAULT 0,
    deliveries_count integer NOT NULL DEFAULT 0,
    availability_json jsonb DEFAULT '{"blocked_dates": [], "available_days": []}'::jsonb,
    simple_mode boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT drivers_pkey PRIMARY KEY (id),
    CONSTRAINT drivers_user_id_key UNIQUE (user_id),
    CONSTRAINT drivers_deliveries_count_check CHECK ((deliveries_count >= 0)),
    CONSTRAINT drivers_rating_avg_check CHECK (((rating_avg >= (0)::numeric) AND (rating_avg <= (5)::numeric)))
);

CREATE TABLE featured_section_items (
    section_id uuid NOT NULL,
    item_id uuid NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    CONSTRAINT featured_section_items_pkey PRIMARY KEY (section_id, item_id)
);

CREATE TABLE featured_sections (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    slug text NOT NULL,
    name text NOT NULL,
    subtitle text,
    icon text,
    accent_color text,
    sort_order integer NOT NULL DEFAULT 0,
    item_count integer NOT NULL DEFAULT 6,
    is_visible boolean NOT NULL DEFAULT true,
    is_predefined boolean NOT NULL DEFAULT false,
    has_unpublished_changes boolean NOT NULL DEFAULT false,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid,
    CONSTRAINT featured_sections_pkey PRIMARY KEY (id),
    CONSTRAINT featured_sections_slug_key UNIQUE (slug)
);

CREATE TABLE item_modifier_groups (
    item_id uuid NOT NULL,
    group_id uuid NOT NULL,
    CONSTRAINT item_modifier_groups_pkey PRIMARY KEY (item_id, group_id)
);

CREATE TABLE location_updates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    driver_id uuid NOT NULL,
    route_id uuid,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    accuracy numeric,
    heading numeric,
    speed numeric,
    recorded_at timestamp with time zone NOT NULL DEFAULT now(),
    source text DEFAULT 'mobile'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT location_updates_pkey PRIMARY KEY (id)
);

CREATE TABLE loyalty_rewards (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    kind text NOT NULL DEFAULT 'milestone'::text,
    milestone integer,
    reward_code text,
    reward_cents integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    acknowledged_at timestamp with time zone,
    expires_at timestamp with time zone,
    redeemed_at timestamp with time zone,
    reminded_at timestamp with time zone,
    CONSTRAINT loyalty_rewards_pkey PRIMARY KEY (id),
    CONSTRAINT loyalty_rewards_milestone_unique UNIQUE (user_id, milestone),
    CONSTRAINT loyalty_rewards_kind_check CHECK ((kind = ANY (ARRAY['milestone'::text, 'thank_you'::text, 'anniversary'::text]))),
    CONSTRAINT loyalty_rewards_reward_cents_check CHECK ((reward_cents >= 0))
);

CREATE TABLE menu_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    slug text NOT NULL,
    name text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT menu_categories_pkey PRIMARY KEY (id),
    CONSTRAINT menu_categories_slug_key UNIQUE (slug)
);

CREATE TABLE menu_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    category_id uuid NOT NULL,
    slug text NOT NULL,
    name_en text NOT NULL,
    name_my text,
    description_en text,
    base_price_cents integer NOT NULL,
    image_url text,
    image_updated_at timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    is_sold_out boolean NOT NULL DEFAULT false,
    allergens text[] NOT NULL DEFAULT '{}'::text[],
    tags text[] NOT NULL DEFAULT '{}'::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT menu_items_pkey PRIMARY KEY (id),
    CONSTRAINT menu_items_slug_key UNIQUE (slug),
    CONSTRAINT menu_items_base_price_cents_check CHECK ((base_price_cents >= 0))
);

CREATE TABLE modifier_groups (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    slug text NOT NULL,
    name text NOT NULL,
    selection_type text NOT NULL DEFAULT 'single'::text,
    min_select integer NOT NULL DEFAULT 0,
    max_select integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT modifier_groups_pkey PRIMARY KEY (id),
    CONSTRAINT modifier_groups_slug_key UNIQUE (slug),
    CONSTRAINT modifier_groups_selection_type_check CHECK ((selection_type = ANY (ARRAY['single'::text, 'multiple'::text])))
);

CREATE TABLE modifier_options (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    group_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    price_delta_cents integer NOT NULL DEFAULT 0,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT modifier_options_pkey PRIMARY KEY (id),
    CONSTRAINT modifier_options_slug_key UNIQUE (slug)
);

CREATE TABLE notification_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_id uuid,
    user_id uuid,
    notification_type notification_type NOT NULL,
    channel text NOT NULL DEFAULT 'email'::text,
    recipient text NOT NULL,
    subject text,
    resend_id text,
    status notification_status NOT NULL DEFAULT 'pending'::notification_status,
    error_message text,
    metadata jsonb,
    retry_count integer DEFAULT 0,
    sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notification_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE order_audit_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL,
    action text NOT NULL,
    actor_id uuid NOT NULL,
    actor_role text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    reason text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT order_audit_log_pkey PRIMARY KEY (id),
    CONSTRAINT order_audit_log_action_check CHECK ((action = ANY (ARRAY['status_change'::text, 'cancel'::text, 'refund'::text, 'edit'::text]))),
    CONSTRAINT order_audit_log_actor_role_check CHECK ((actor_role = ANY (ARRAY['customer'::text, 'admin'::text, 'driver'::text, 'system'::text])))
);

CREATE TABLE order_item_modifiers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_item_id uuid NOT NULL,
    modifier_option_id uuid,
    name_snapshot text NOT NULL,
    price_delta_snapshot integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT order_item_modifiers_pkey PRIMARY KEY (id)
);

CREATE TABLE order_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL,
    menu_item_id uuid,
    name_snapshot text NOT NULL,
    base_price_snapshot integer NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    line_total_cents integer NOT NULL,
    special_instructions text,
    refunded_quantity integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name_my_snapshot text,
    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_line_total_cents_check CHECK ((line_total_cents >= 0)),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_refunded_quantity_check CHECK ((refunded_quantity >= 0))
);

CREATE TABLE orders (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    address_id uuid,
    status order_status NOT NULL DEFAULT 'pending'::order_status,
    subtotal_cents integer NOT NULL,
    delivery_fee_cents integer NOT NULL DEFAULT 0,
    tax_cents integer NOT NULL DEFAULT 0,
    total_cents integer NOT NULL,
    tip_cents integer NOT NULL DEFAULT 0,
    promo_code text,
    discount_cents integer NOT NULL DEFAULT 0,
    delivery_window_start timestamp with time zone,
    delivery_window_end timestamp with time zone,
    special_instructions text,
    delivery_instructions text,
    stripe_payment_intent_id text,
    refund_status text NOT NULL DEFAULT 'none'::text,
    rating_dismissed boolean NOT NULL DEFAULT false,
    share_token text,
    is_priority boolean DEFAULT false,
    needs_contact boolean DEFAULT false,
    contacted_at timestamp with time zone,
    contacted_by uuid,
    placed_at timestamp with time zone NOT NULL DEFAULT now(),
    confirmed_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_driver_id uuid,
    stripe_checkout_session_id text,
    payment_method text NOT NULL DEFAULT 'stripe'::text,
    cod_approved_at timestamp with time zone,
    cod_approved_by uuid,
    customer_phone text,
    customer_name text,
    distance_miles double precision,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_share_token_key UNIQUE (share_token),
    CONSTRAINT orders_delivery_fee_cents_check CHECK ((delivery_fee_cents >= 0)),
    CONSTRAINT orders_discount_cents_check CHECK ((discount_cents >= 0)),
    CONSTRAINT orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['stripe'::text, 'cod'::text]))),
    CONSTRAINT orders_refund_status_check CHECK ((refund_status = ANY (ARRAY['none'::text, 'partial'::text, 'full'::text]))),
    CONSTRAINT orders_subtotal_cents_check CHECK ((subtotal_cents >= 0)),
    CONSTRAINT orders_tax_cents_check CHECK ((tax_cents >= 0)),
    CONSTRAINT orders_tip_cents_check CHECK ((tip_cents >= 0)),
    CONSTRAINT orders_total_cents_check CHECK ((total_cents >= 0))
);

CREATE TABLE profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    phone text,
    role text NOT NULL DEFAULT 'customer'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_winback_at timestamp with time zone,
    referral_code text,
    welcomed_at timestamp with time zone,
    loyalty_thanked_at timestamp with time zone,
    last_anniversary_at timestamp with time zone,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_referral_code_key UNIQUE (referral_code),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['customer'::text, 'admin'::text, 'driver'::text])))
);

CREATE TABLE push_subscriptions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);

CREATE TABLE referrals (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    referrer_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    reward_code text,
    reward_cents integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT referrals_pkey PRIMARY KEY (id),
    CONSTRAINT referrals_referee_unique UNIQUE (referee_id),
    CONSTRAINT referrals_not_self CHECK ((referrer_id <> referee_id)),
    CONSTRAINT referrals_reward_cents_check CHECK ((reward_cents >= 0)),
    CONSTRAINT referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text])))
);

CREATE TABLE route_stops (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    route_id uuid NOT NULL,
    order_id uuid NOT NULL,
    stop_index integer NOT NULL,
    eta timestamp with time zone,
    status route_stop_status NOT NULL DEFAULT 'pending'::route_stop_status,
    arrived_at timestamp with time zone,
    delivered_at timestamp with time zone,
    delivery_photo_url text,
    delivery_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT route_stops_pkey PRIMARY KEY (id),
    CONSTRAINT route_stops_route_id_order_id_key UNIQUE (route_id, order_id),
    CONSTRAINT route_stops_route_id_stop_index_key UNIQUE (route_id, stop_index) DEFERRABLE,
    CONSTRAINT chk_stop_index_bounds CHECK (((stop_index >= 0) AND (stop_index < 1000))),
    CONSTRAINT route_stops_stop_index_check CHECK ((stop_index >= 0))
);

CREATE TABLE routes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    delivery_date date NOT NULL,
    driver_id uuid,
    status route_status NOT NULL DEFAULT 'planned'::route_status,
    optimized_polyline text,
    stats_json jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    accepted_at timestamp with time zone,
    declined_at timestamp with time zone,
    declined_reason text,
    declined_by uuid,
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    CONSTRAINT chk_planned_unassigned CHECK (((status <> 'planned'::route_status) OR (driver_id IS NULL)))
);

CREATE TABLE webhook_audit_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    svix_id text,
    event_type text NOT NULL,
    payload_hash text NOT NULL,
    signature_valid boolean NOT NULL,
    source_ip text,
    processed_at timestamp with time zone NOT NULL DEFAULT now(),
    error_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT webhook_audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE webhook_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    event_id text NOT NULL,
    event_type text NOT NULL,
    processed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT webhook_events_pkey PRIMARY KEY (id),
    CONSTRAINT webhook_events_event_id_key UNIQUE (event_id)
);

-- Foreign keys ----------------------------------------------------------------
ALTER TABLE addresses ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id);
ALTER TABLE carts ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customer_feedback ADD CONSTRAINT customer_feedback_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE customer_feedback ADD CONSTRAINT customer_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE customer_settings ADD CONSTRAINT customer_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE delivery_exceptions ADD CONSTRAINT delivery_exceptions_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES profiles(id);
ALTER TABLE delivery_exceptions ADD CONSTRAINT delivery_exceptions_route_stop_id_fkey FOREIGN KEY (route_stop_id) REFERENCES route_stops(id) ON DELETE CASCADE;
ALTER TABLE driver_badges ADD CONSTRAINT driver_badges_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE driver_invites ADD CONSTRAINT driver_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES profiles(id);
ALTER TABLE driver_ratings ADD CONSTRAINT driver_ratings_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE driver_ratings ADD CONSTRAINT driver_ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE driver_ratings ADD CONSTRAINT driver_ratings_route_stop_id_fkey FOREIGN KEY (route_stop_id) REFERENCES route_stops(id) ON DELETE SET NULL;
ALTER TABLE drivers ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE featured_section_items ADD CONSTRAINT featured_section_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE;
ALTER TABLE featured_section_items ADD CONSTRAINT featured_section_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES featured_sections(id) ON DELETE CASCADE;
ALTER TABLE featured_sections ADD CONSTRAINT featured_sections_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE item_modifier_groups ADD CONSTRAINT item_modifier_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE;
ALTER TABLE item_modifier_groups ADD CONSTRAINT item_modifier_groups_item_id_fkey FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE;
ALTER TABLE location_updates ADD CONSTRAINT location_updates_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;
ALTER TABLE location_updates ADD CONSTRAINT location_updates_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE loyalty_rewards ADD CONSTRAINT loyalty_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE RESTRICT;
ALTER TABLE modifier_options ADD CONSTRAINT modifier_options_group_id_fkey FOREIGN KEY (group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE;
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE order_audit_log ADD CONSTRAINT order_audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id);
ALTER TABLE order_audit_log ADD CONSTRAINT order_audit_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_item_modifiers ADD CONSTRAINT order_item_modifiers_modifier_option_id_fkey FOREIGN KEY (modifier_option_id) REFERENCES modifier_options(id) ON DELETE SET NULL;
ALTER TABLE order_item_modifiers ADD CONSTRAINT order_item_modifiers_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL;
ALTER TABLE orders ADD CONSTRAINT orders_assigned_driver_id_fkey FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD CONSTRAINT orders_cod_approved_by_fkey FOREIGN KEY (cod_approved_by) REFERENCES profiles(id);
ALTER TABLE orders ADD CONSTRAINT orders_contacted_by_fkey FOREIGN KEY (contacted_by) REFERENCES profiles(id);
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE referrals ADD CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE referrals ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE route_stops ADD CONSTRAINT route_stops_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE route_stops ADD CONSTRAINT route_stops_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
ALTER TABLE routes ADD CONSTRAINT routes_declined_by_fkey FOREIGN KEY (declined_by) REFERENCES drivers(id);
ALTER TABLE routes ADD CONSTRAINT routes_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

-- Materialized views ----------------------------------------------------------
CREATE MATERIALIZED VIEW delivery_metrics_mv AS
 SELECT r.delivery_date,
    count(DISTINCT o.id) AS total_orders,
    count(DISTINCT o.id) FILTER (WHERE o.status <> 'cancelled'::order_status) AS confirmed_orders,
    count(DISTINCT o.id) FILTER (WHERE o.status = 'cancelled'::order_status) AS cancelled_orders,
    COALESCE(sum(o.total_cents) FILTER (WHERE o.status <> 'cancelled'::order_status), 0::bigint) AS total_revenue_cents,
    COALESCE(sum(o.total_cents) FILTER (WHERE o.status = 'cancelled'::order_status), 0::bigint) AS cancelled_revenue_cents,
    round(avg(o.total_cents) FILTER (WHERE o.status <> 'cancelled'::order_status)) AS avg_order_cents,
    count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status) AS delivered_count,
    count(DISTINCT rs.id) FILTER (WHERE rs.status = 'skipped'::route_stop_status) AS skipped_count,
    count(DISTINCT rs.id) AS total_stops,
    COALESCE(round(count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status)::numeric / NULLIF(count(DISTINCT rs.id), 0)::numeric * 100::numeric, 1), 0::numeric) AS delivery_success_rate,
    COALESCE(round(count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status AND rs.eta IS NOT NULL AND abs(EXTRACT(epoch FROM rs.delivered_at - rs.eta)) <= 600::numeric)::numeric / NULLIF(count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status AND rs.eta IS NOT NULL), 0)::numeric * 100::numeric, 1), 0::numeric) AS eta_accuracy_rate,
    count(DISTINCT r.id) AS total_routes,
    count(DISTINCT r.driver_id) AS active_drivers,
    round(avg(EXTRACT(epoch FROM r.completed_at - r.started_at) / 60::numeric) FILTER (WHERE r.status = 'completed'::route_status), 1) AS avg_route_duration_minutes,
    count(DISTINCT de.id) AS total_exceptions
   FROM routes r
     LEFT JOIN route_stops rs ON r.id = rs.route_id
     LEFT JOIN orders o ON rs.order_id = o.id
     LEFT JOIN delivery_exceptions de ON rs.id = de.route_stop_id
  WHERE r.delivery_date >= (now() - '90 days'::interval)
  GROUP BY r.delivery_date
  ORDER BY r.delivery_date DESC
WITH NO DATA;

CREATE MATERIALIZED VIEW driver_stats_mv AS
 SELECT d.id AS driver_id,
    d.user_id,
    p.full_name,
    p.email,
    d.is_active,
    d.vehicle_type,
    d.profile_image_url,
    count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status) AS total_deliveries,
    count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status AND rs.delivered_at >= (now() - '7 days'::interval)) AS deliveries_last_7_days,
    count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status AND rs.delivered_at >= (now() - '30 days'::interval)) AS deliveries_last_30_days,
    COALESCE(round(count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status AND (rs.eta IS NULL OR rs.delivered_at <= (rs.eta + '00:10:00'::interval)))::numeric / NULLIF(count(DISTINCT rs.id) FILTER (WHERE rs.status = 'delivered'::route_stop_status), 0)::numeric * 100::numeric, 1), 0::numeric) AS on_time_rate,
    round(avg(EXTRACT(epoch FROM rs.delivered_at - rs.arrived_at) / 60::numeric) FILTER (WHERE rs.status = 'delivered'::route_stop_status AND rs.arrived_at IS NOT NULL), 1) AS avg_delivery_minutes,
    count(DISTINCT dr.id) AS total_ratings,
    round(avg(dr.rating), 2) AS avg_rating,
    count(dr.id) FILTER (WHERE dr.rating = 5) AS ratings_5_star,
    count(dr.id) FILTER (WHERE dr.rating = 4) AS ratings_4_star,
    count(dr.id) FILTER (WHERE dr.rating = 3) AS ratings_3_star,
    count(dr.id) FILTER (WHERE dr.rating = 2) AS ratings_2_star,
    count(dr.id) FILTER (WHERE dr.rating = 1) AS ratings_1_star,
    count(DISTINCT de.id) AS total_exceptions,
    count(DISTINCT de.id) FILTER (WHERE de.exception_type = 'customer_not_home'::delivery_exception_type) AS exceptions_not_home,
    count(DISTINCT de.id) FILTER (WHERE de.exception_type = 'wrong_address'::delivery_exception_type) AS exceptions_wrong_address,
    count(DISTINCT de.id) FILTER (WHERE de.exception_type = 'access_issue'::delivery_exception_type) AS exceptions_access,
    count(DISTINCT de.id) FILTER (WHERE de.exception_type = 'refused_delivery'::delivery_exception_type) AS exceptions_refused,
    count(DISTINCT de.id) FILTER (WHERE de.exception_type = 'damaged_order'::delivery_exception_type) AS exceptions_damaged,
    d.created_at AS driver_since,
    max(r.completed_at) AS last_route_completed
   FROM drivers d
     LEFT JOIN profiles p ON d.user_id = p.id
     LEFT JOIN routes r ON d.id = r.driver_id
     LEFT JOIN route_stops rs ON r.id = rs.route_id
     LEFT JOIN driver_ratings dr ON d.id = dr.driver_id
     LEFT JOIN delivery_exceptions de ON rs.id = de.route_stop_id
  GROUP BY d.id, d.user_id, p.full_name, p.email, d.is_active, d.vehicle_type, d.profile_image_url, d.created_at
WITH NO DATA;

-- Functions -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_order record;
  v_item record;
  v_req jsonb;
  v_already_refunded int;
  v_remaining int;
  v_unit_price numeric;
  v_refund_amount int;
  v_total_refund int := 0;
  v_shipping_refund int := 0;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Lock the order row
  SELECT id, total_cents, delivery_fee_cents
    INTO v_order
    FROM orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Process each item
  FOR v_req IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Lock the order item row
    SELECT id, order_id, name_snapshot, quantity, line_total_cents,
           COALESCE(refunded_quantity, 0) AS refunded_qty
      INTO v_item
      FROM order_items
     WHERE id = (v_req->>'orderItemId')::uuid
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order item not found: %', v_req->>'orderItemId';
    END IF;

    IF v_item.order_id != p_order_id THEN
      RAISE EXCEPTION 'Item % does not belong to order %', v_item.id, p_order_id;
    END IF;

    v_already_refunded := v_item.refunded_qty;
    v_remaining := v_item.quantity - v_already_refunded;

    IF (v_req->>'quantity')::int > v_remaining THEN
      RAISE EXCEPTION 'Cannot refund % of "%" — only % remaining',
        (v_req->>'quantity')::int, v_item.name_snapshot, v_remaining;
    END IF;

    v_unit_price := v_item.line_total_cents::numeric / v_item.quantity;
    v_refund_amount := round(v_unit_price * (v_req->>'quantity')::int);

    UPDATE order_items
       SET refunded_quantity = v_already_refunded + (v_req->>'quantity')::int
     WHERE id = v_item.id;

    v_total_refund := v_total_refund + v_refund_amount;

    v_results := v_results || jsonb_build_object(
      'orderItemId', v_item.id,
      'name', v_item.name_snapshot,
      'quantityRefunded', (v_req->>'quantity')::int,
      'refundAmountCents', v_refund_amount
    );
  END LOOP;

  -- Shipping refund
  IF p_refund_shipping AND v_order.delivery_fee_cents > 0 THEN
    v_shipping_refund := v_order.delivery_fee_cents;
    v_total_refund := v_total_refund + v_shipping_refund;
  END IF;

  -- Validate total
  IF v_total_refund > v_order.total_cents THEN
    RAISE EXCEPTION 'Refund $% exceeds order total $%',
      (v_total_refund / 100.0)::numeric(10,2),
      (v_order.total_cents / 100.0)::numeric(10,2);
  END IF;

  RETURN jsonb_build_object(
    'refundedItems', v_results,
    'shippingRefundCents', v_shipping_refund,
    'totalRefundCents', v_total_refund
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.batch_update_stop_indices(p_stop_ids uuid[], p_indices integer[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF array_length(p_stop_ids, 1) != array_length(p_indices, 1) THEN
    RAISE EXCEPTION 'stop_ids and indices arrays must have same length';
  END IF;

  -- Defer uniqueness check until end of transaction
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  UPDATE route_stops rs
  SET stop_index = data.new_index
  FROM unnest(p_stop_ids, p_indices) AS data(stop_id, new_index)
  WHERE rs.id = data.stop_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_driver_streak(p_driver_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_route BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM routes
    WHERE driver_id = p_driver_id
      AND delivery_date = CURRENT_DATE
      AND status IN ('in_progress', 'completed')
  ) INTO v_has_route;

  IF v_has_route THEN
    v_streak := 1;
  END IF;

  v_check_date := CURRENT_DATE - 1;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM routes
      WHERE driver_id = p_driver_id
        AND delivery_date = v_check_date
        AND status = 'completed'
    ) INTO v_has_route;

    EXIT WHEN NOT v_has_route;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  RETURN v_streak;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_driver_weekly_deliveries(p_driver_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
  v_week_start DATE;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM route_stops rs
  JOIN routes r ON r.id = rs.route_id
  WHERE r.driver_id = p_driver_id
    AND r.delivery_date >= v_week_start
    AND r.delivery_date < v_week_start + 7
    AND rs.status = 'delivered';
  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_route_stats(p_route_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_stops', COUNT(*),
    'pending_stops', COUNT(*) FILTER (WHERE status = 'pending'),
    'delivered_stops', COUNT(*) FILTER (WHERE status = 'delivered'),
    'skipped_stops', COUNT(*) FILTER (WHERE status = 'skipped'),
    'completion_rate',
      CASE WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0 END
  ) INTO v_stats
  FROM route_stops
  WHERE route_id = p_route_id;
  RETURN v_stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_route_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  non_terminal_count integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT count(*) INTO non_terminal_count
    FROM route_stops
    WHERE route_id = NEW.id
      AND status NOT IN ('delivered', 'skipped');

    IF non_terminal_count > 0 THEN
      RAISE EXCEPTION 'Cannot complete route: % stops are not in terminal state (delivered/skipped)', non_terminal_count;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.compute_order_refund_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_qty integer;
  total_refunded integer;
BEGIN
  SELECT
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(COALESCE(refunded_quantity, 0)), 0)
  INTO total_qty, total_refunded
  FROM order_items
  WHERE order_id = NEW.order_id;

  UPDATE orders
  SET refund_status = CASE
    WHEN total_refunded = 0 THEN 'none'
    WHEN total_refunded >= total_qty THEN 'full'
    ELSE 'partial'
  END
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb, p_modifiers jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_item_ids UUID[];
  v_item JSONB;
  v_modifier JSONB;
  v_inserted_id UUID;
  v_result JSONB;
  v_status order_status;
  v_payment_method TEXT;
BEGIN
  -- Determine payment method and initial status
  v_payment_method := COALESCE(p_order->>'payment_method', 'stripe');
  IF v_payment_method = 'cod' THEN
    v_status := 'pending_approval';
  ELSE
    v_status := 'pending';
  END IF;

  -- 1. Insert order
  INSERT INTO orders (
    user_id, address_id, status, payment_method,
    subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
    tip_cents, promo_code, discount_cents,
    delivery_window_start, delivery_window_end,
    special_instructions, delivery_instructions,
    customer_phone, customer_name, distance_miles
  ) VALUES (
    (p_order->>'user_id')::UUID,
    (p_order->>'address_id')::UUID,
    v_status,
    v_payment_method,
    (p_order->>'subtotal_cents')::INTEGER,
    (p_order->>'delivery_fee_cents')::INTEGER,
    (p_order->>'tax_cents')::INTEGER,
    (p_order->>'total_cents')::INTEGER,
    COALESCE((p_order->>'tip_cents')::INTEGER, 0),
    p_order->>'promo_code',
    COALESCE((p_order->>'discount_cents')::INTEGER, 0),
    (p_order->>'delivery_window_start')::TIMESTAMPTZ,
    (p_order->>'delivery_window_end')::TIMESTAMPTZ,
    p_order->>'special_instructions',
    p_order->>'delivery_instructions',
    p_order->>'customer_phone',
    p_order->>'customer_name',
    (p_order->>'distance_miles')::DOUBLE PRECISION
  )
  RETURNING id INTO v_order_id;

  -- 2. Insert order items and collect their IDs
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, name_snapshot, name_my_snapshot,
      base_price_snapshot, quantity, line_total_cents, special_instructions
    ) VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'name_snapshot',
      v_item->>'name_my_snapshot',
      (v_item->>'base_price_snapshot')::INTEGER,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'line_total_cents')::INTEGER,
      v_item->>'special_instructions'
    )
    RETURNING id INTO v_inserted_id;

    v_item_ids := array_append(v_item_ids, v_inserted_id);
  END LOOP;

  -- 3. Insert modifiers
  FOR v_modifier IN SELECT * FROM jsonb_array_elements(p_modifiers)
  LOOP
    INSERT INTO order_item_modifiers (
      order_item_id, modifier_option_id,
      name_snapshot, price_delta_snapshot
    ) VALUES (
      v_item_ids[(v_modifier->>'item_index')::INTEGER + 1],
      (v_modifier->>'modifier_option_id')::UUID,
      v_modifier->>'name_snapshot',
      (v_modifier->>'price_delta_snapshot')::INTEGER
    );
  END LOOP;

  -- Return order ID and item IDs
  v_result := jsonb_build_object(
    'order_id', v_order_id,
    'order_item_ids', to_jsonb(v_item_ids)
  );

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_menu_item_photo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
DECLARE
  v_path TEXT;
BEGIN
  IF OLD.image_url IS NOT NULL AND OLD.image_url LIKE '%menu-photos/%' THEN
    v_path := substring(OLD.image_url FROM 'menu-photos/(.+)$');
    IF v_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'menu-photos'
        AND name = v_path;
    END IF;
  END IF;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delivery_date(ts timestamp with time zone)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
AS $function$ SELECT (ts AT TIME ZONE 'America/Los_Angeles')::date $function$
;

CREATE OR REPLACE FUNCTION public.get_anniversary_customers(p_limit integer DEFAULT 100)
 RETURNS TABLE(user_id uuid, email text, full_name text, years integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  la_today DATE := (now() AT TIME ZONE 'America/Los_Angeles')::date;
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    (EXTRACT(YEAR FROM la_today) - EXTRACT(YEAR FROM fo.first_at))::INTEGER AS years
  FROM profiles p
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  JOIN (
    SELECT o.user_id, MIN(o.placed_at AT TIME ZONE 'America/Los_Angeles') AS first_at
    FROM orders o
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'pending_approval')
    GROUP BY o.user_id
  ) fo ON fo.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
    -- Anniversary day (month + day) matches today...
    AND EXTRACT(MONTH FROM fo.first_at) = EXTRACT(MONTH FROM la_today)
    AND EXTRACT(DAY FROM fo.first_at) = EXTRACT(DAY FROM la_today)
    -- ...and the first order was in a prior year (so years >= 1).
    AND fo.first_at < date_trunc('year', la_today::timestamp)
    -- ...and not already celebrated this calendar year.
    AND (
      p.last_anniversary_at IS NULL
      OR EXTRACT(YEAR FROM (p.last_anniversary_at AT TIME ZONE 'America/Los_Angeles'))
         < EXTRACT(YEAR FROM la_today)
    )
  ORDER BY years DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_delivery_metrics_admin()
 RETURNS SETOF delivery_metrics_mv
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM delivery_metrics_mv;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_latest_location(p_driver_id uuid)
 RETURNS TABLE(latitude numeric, longitude numeric, recorded_at timestamp with time zone, accuracy numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    lu.latitude,
    lu.longitude,
    lu.recorded_at,
    lu.accuracy
  FROM location_updates lu
  WHERE lu.driver_id = p_driver_id
  ORDER BY lu.recorded_at DESC
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_performance(p_driver_id uuid)
 RETURNS TABLE(total_deliveries bigint, deliveries_last_7_days bigint, deliveries_last_30_days bigint, on_time_rate numeric, avg_rating numeric, total_ratings bigint, total_exceptions bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() AND p_driver_id != public.get_my_driver_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT
    ds.total_deliveries,
    ds.deliveries_last_7_days,
    ds.deliveries_last_30_days,
    ds.on_time_rate,
    ds.avg_rating,
    ds.total_ratings,
    ds.total_exceptions
  FROM driver_stats_mv ds
  WHERE ds.driver_id = p_driver_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_driver_stats_admin()
 RETURNS SETOF driver_stats_mv
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT * FROM driver_stats_mv;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_expiring_loyalty_rewards(p_days integer DEFAULT 7, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, user_id uuid, email text, full_name text, reward_code text, reward_cents integer, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT lr.id, lr.user_id, p.email, p.full_name, lr.reward_code, lr.reward_cents, lr.expires_at
  FROM loyalty_rewards lr
  JOIN profiles p ON p.id = lr.user_id
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  WHERE lr.reward_code IS NOT NULL
    AND lr.redeemed_at IS NULL
    AND lr.reminded_at IS NULL
    AND lr.expires_at IS NOT NULL
    AND lr.expires_at > now()
    AND lr.expires_at <= now() + make_interval(days => p_days)
    AND p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
  ORDER BY lr.expires_at ASC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_lapsed_customers(p_limit integer DEFAULT 100)
 RETURNS TABLE(user_id uuid, email text, full_name text, last_order_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, last_orders.last_order_at
  FROM profiles p
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  JOIN (
    SELECT o.user_id, MAX(o.placed_at) AS last_order_at
    FROM orders o
    WHERE o.status <> 'cancelled'
    GROUP BY o.user_id
  ) last_orders ON last_orders.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
    AND last_orders.last_order_at < NOW() - INTERVAL '30 days'
    AND last_orders.last_order_at > NOW() - INTERVAL '90 days'
    AND (p.last_winback_at IS NULL OR p.last_winback_at < NOW() - INTERVAL '60 days')
  ORDER BY last_orders.last_order_at ASC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_loyalty_thankyou_candidates(p_limit integer DEFAULT 100)
 RETURNS TABLE(user_id uuid, email text, full_name text, order_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, oc.cnt
  FROM profiles p
  LEFT JOIN customer_settings cs ON cs.user_id = p.id
  JOIN (
    SELECT o.user_id, COUNT(*) AS cnt
    FROM orders o
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered', 'pending_approval')
    GROUP BY o.user_id
  ) oc ON oc.user_id = p.id
  WHERE p.email IS NOT NULL
    AND p.role = 'customer'
    AND COALESCE((cs.notification_prefs->>'marketing')::boolean, true) = true
    AND p.loyalty_thanked_at IS NULL
  ORDER BY oc.cnt DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_loyalty_tier_distribution()
 RETURNS TABLE(tier text, customers bigint, orders bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH order_refunds AS (
    -- Refunded food value per order, proportional to refunded_quantity.
    SELECT
      oi.order_id,
      COALESCE(
        SUM(
          CASE
            WHEN oi.quantity > 0 AND COALESCE(oi.refunded_quantity, 0) > 0
            THEN ROUND(
              (oi.line_total_cents::numeric / oi.quantity)
              * LEAST(oi.refunded_quantity, oi.quantity)
            )
            ELSE 0
          END
        ),
        0
      ) AS refunded_cents
    FROM order_items oi
    GROUP BY oi.order_id
  ),
  per_customer AS (
    SELECT
      o.user_id,
      COUNT(*) AS order_count,
      -- Net spend: subtotal − discount − refunds, floored at 0 per order.
      SUM(
        GREATEST(
          0,
          o.subtotal_cents
          - COALESCE(o.discount_cents, 0)
          - COALESCE(r.refunded_cents, 0)
        )
      ) AS spend_cents
    FROM orders o
    JOIN profiles p ON p.id = o.user_id AND p.role = 'customer'
    LEFT JOIN order_refunds r ON r.order_id = o.id
    WHERE o.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered')
    GROUP BY o.user_id
  ),
  bucketed AS (
    SELECT
      CASE
        WHEN spend_cents >= 150000 THEN 'gold'
        WHEN spend_cents >= 75000 THEN 'ruby'
        WHEN spend_cents >= 25000 THEN 'jade'
        ELSE 'new'
      END AS tier,
      order_count
    FROM per_customer
  )
  SELECT b.tier, COUNT(*)::BIGINT AS customers, SUM(b.order_count)::BIGINT AS orders
  FROM bucketed b
  GROUP BY b.tier;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_driver_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT id INTO v_driver_id
  FROM public.drivers
  WHERE user_id = (select auth.uid());
  RETURN v_driver_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    WHERE profiles.email IS NULL;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = (select auth.uid());
  RETURN COALESCE(v_role = 'admin', false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_driver()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = (select auth.uid());
  RETURN COALESCE(v_role = 'driver', false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.merge_routes(p_destination_route_id uuid, p_source_route_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max_index int;
  v_total_stops int;
  v_source_status text;
  v_dest_driver_id uuid;
BEGIN
  -- Validate source is not in_progress or completed (allow planned, assigned, accepted)
  SELECT status INTO STRICT v_source_status
  FROM routes WHERE id = p_source_route_id;

  IF v_source_status NOT IN ('planned', 'assigned', 'accepted') THEN
    RAISE EXCEPTION 'Can only merge planned/assigned/accepted routes (source is %)', v_source_status;
  END IF;

  -- Validate destination route exists and get its driver_id
  SELECT driver_id INTO STRICT v_dest_driver_id
  FROM routes WHERE id = p_destination_route_id;

  -- Get max stop_index in destination
  SELECT COALESCE(MAX(stop_index), -1) INTO v_max_index
  FROM route_stops WHERE route_id = p_destination_route_id;

  -- Defer unique constraint
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move all stops from source to destination, appending after last stop
  UPDATE route_stops
  SET route_id = p_destination_route_id,
      stop_index = v_max_index + 1 + sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE route_id = p_source_route_id
  ) sub
  WHERE route_stops.id = sub.id;

  -- Delete source route (no more stops, safe to delete)
  DELETE FROM routes WHERE id = p_source_route_id;

  -- After merge, if target has a driver, set to 'assigned' (driver needs to re-accept modified route)
  IF v_dest_driver_id IS NOT NULL THEN
    UPDATE routes
    SET status = 'assigned', accepted_at = NULL
    WHERE id = p_destination_route_id;
  END IF;

  -- Update destination stats
  PERFORM update_route_stats(p_destination_route_id);

  -- Return total stop count
  SELECT count(*) INTO v_total_stops
  FROM route_stops WHERE route_id = p_destination_route_id;

  RETURN v_total_stops;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_active_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM route_stops rs
    JOIN routes r ON r.id = rs.route_id
    WHERE rs.order_id = NEW.order_id
      AND r.status != 'completed'
      AND rs.route_id != NEW.route_id
  ) THEN
    RAISE EXCEPTION 'Order % is already assigned to an active route', NEW.order_id
      USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.promote_next_stop(p_route_id uuid, p_completed_stop_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_next_stop_id uuid;
  v_next_stop_index int;
BEGIN
  -- Validate completed stop belongs to this route and is in terminal state
  IF NOT EXISTS (
    SELECT 1 FROM route_stops
    WHERE id = p_completed_stop_id
      AND route_id = p_route_id
      AND status IN ('delivered', 'skipped')
  ) THEN
    RAISE EXCEPTION 'Stop % is not a completed stop in route %',
      p_completed_stop_id, p_route_id
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Atomically select and lock the next pending stop
  -- SKIP LOCKED: if another transaction has this row locked, skip it
  -- and find the next one (prevents double-promotion)
  SELECT id, stop_index
  INTO v_next_stop_id, v_next_stop_index
  FROM route_stops
  WHERE route_id = p_route_id
    AND status = 'pending'
  ORDER BY stop_index ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- No pending stops remain - all stops are complete
  IF v_next_stop_id IS NULL THEN
    -- Still update stats to reflect final state
    PERFORM update_route_stats(p_route_id);
    RETURN jsonb_build_object(
      'promoted_stop_id', NULL,
      'stop_index', NULL
    );
  END IF;

  -- Promote the locked stop to enroute
  UPDATE route_stops
  SET status = 'enroute'
  WHERE id = v_next_stop_id;

  -- Update route stats atomically within the same transaction
  PERFORM update_route_stats(p_route_id);

  RETURN jsonb_build_object(
    'promoted_stop_id', v_next_stop_id,
    'stop_index', v_next_stop_index
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  REFRESH MATERIALIZED VIEW CONCURRENTLY driver_stats_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY delivery_metrics_mv;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reindex_route_stops(p_route_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Use a CTE to compute new indices and update in one shot
  WITH ranked AS (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE route_id = p_route_id
  )
  UPDATE route_stops rs
  SET stop_index = ranked.new_index
  FROM ranked
  WHERE rs.id = ranked.id
    AND rs.stop_index != ranked.new_index;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.split_route(p_source_route_id uuid, p_stop_ids uuid[], p_new_driver_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_route_id uuid;
  v_delivery_date date;
  v_remaining_count int;
  v_source_status text;
  v_new_status text;
BEGIN
  -- Validate source route exists
  SELECT delivery_date, status INTO STRICT v_delivery_date, v_source_status
  FROM routes WHERE id = p_source_route_id;

  -- Validate all stop IDs belong to source route
  IF NOT (
    SELECT count(*) = array_length(p_stop_ids, 1)
    FROM route_stops
    WHERE id = ANY(p_stop_ids) AND route_id = p_source_route_id
  ) THEN
    RAISE EXCEPTION 'Some stop IDs do not belong to source route';
  END IF;

  -- Validate at least 1 stop remains in source after split
  SELECT count(*) INTO v_remaining_count
  FROM route_stops
  WHERE route_id = p_source_route_id AND id != ALL(p_stop_ids);

  IF v_remaining_count < 1 THEN
    RAISE EXCEPTION 'At least one stop must remain in the source route';
  END IF;

  -- Determine new route status: 'assigned' if driver provided, else 'planned'
  IF p_new_driver_id IS NOT NULL THEN
    v_new_status := 'assigned';
  ELSE
    v_new_status := 'planned';
  END IF;

  -- Create new route
  INSERT INTO routes (delivery_date, driver_id, status)
  VALUES (v_delivery_date, p_new_driver_id, v_new_status)
  RETURNING id INTO v_new_route_id;

  -- Defer unique constraint for reindexing
  SET CONSTRAINTS route_stops_route_id_stop_index_key DEFERRED;

  -- Move stops via UPDATE (avoids prevent_duplicate_active_assignment trigger on INSERT)
  UPDATE route_stops
  SET route_id = v_new_route_id, stop_index = sub.new_index
  FROM (
    SELECT id, row_number() OVER (ORDER BY stop_index) - 1 AS new_index
    FROM route_stops
    WHERE id = ANY(p_stop_ids)
  ) sub
  WHERE route_stops.id = sub.id;

  -- Reindex source route remaining stops
  PERFORM reindex_route_stops(p_source_route_id);

  -- If source was 'accepted', reset to 'assigned' (driver needs to re-accept modified route)
  IF v_source_status IN ('assigned', 'accepted') THEN
    UPDATE routes
    SET status = 'assigned', accepted_at = NULL
    WHERE id = p_source_route_id;
  END IF;

  -- Update stats for both routes
  PERFORM update_route_stats(p_source_route_id);
  PERFORM update_route_stats(v_new_route_id);

  RETURN v_new_route_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_driver_deliveries_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_driver_id UUID;
BEGIN
  SELECT r.driver_id INTO v_driver_id
  FROM routes r WHERE r.id = NEW.route_id;

  IF v_driver_id IS NOT NULL AND NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status != 'delivered') THEN
    UPDATE drivers
    SET deliveries_count = deliveries_count + 1, updated_at = NOW()
    WHERE id = v_driver_id;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_driver_rating_avg()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_avg NUMERIC(3, 2);
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 2) INTO v_new_avg
  FROM driver_ratings
  WHERE driver_id = NEW.driver_id;

  UPDATE drivers
  SET rating_avg = COALESCE(v_new_avg, 0), updated_at = NOW()
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_image_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
    NEW.image_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_route_stats(p_route_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_stops', count(*),
    'pending_stops', count(*) FILTER (WHERE status = 'pending'),
    'delivered_stops', count(*) FILTER (WHERE status = 'delivered'),
    'skipped_stops', count(*) FILTER (WHERE status = 'skipped'),
    'completion_rate', CASE
      WHEN count(*) > 0
      THEN round((count(*) FILTER (WHERE status = 'delivered'))::numeric / count(*) * 100)
      ELSE 0
    END
  )
  INTO v_stats
  FROM route_stops
  WHERE route_id = p_route_id;

  UPDATE routes
  SET stats_json = v_stats
  WHERE id = p_route_id;

  RETURN v_stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

-- Function privileges ---------------------------------------------------------
REVOKE ALL ON FUNCTION public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean) TO anon;
GRANT EXECUTE ON FUNCTION public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_item_refunds(p_order_id uuid, p_items jsonb, p_refund_shipping boolean) TO service_role;
REVOKE ALL ON FUNCTION public.batch_update_stop_indices(p_stop_ids uuid[], p_indices integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.batch_update_stop_indices(p_stop_ids uuid[], p_indices integer[]) TO anon;
GRANT EXECUTE ON FUNCTION public.batch_update_stop_indices(p_stop_ids uuid[], p_indices integer[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_update_stop_indices(p_stop_ids uuid[], p_indices integer[]) TO service_role;
REVOKE ALL ON FUNCTION public.calculate_driver_streak(p_driver_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_driver_streak(p_driver_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_driver_streak(p_driver_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_driver_streak(p_driver_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.calculate_driver_weekly_deliveries(p_driver_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_driver_weekly_deliveries(p_driver_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_driver_weekly_deliveries(p_driver_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_driver_weekly_deliveries(p_driver_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.calculate_route_stats(p_route_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_route_stats(p_route_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_route_stats(p_route_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_route_stats(p_route_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.check_route_completion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_route_completion() TO anon;
GRANT EXECUTE ON FUNCTION public.check_route_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_route_completion() TO service_role;
REVOKE ALL ON FUNCTION public.compute_order_refund_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_order_refund_status() TO anon;
GRANT EXECUTE ON FUNCTION public.compute_order_refund_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_order_refund_status() TO service_role;
REVOKE ALL ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb, p_modifiers jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb, p_modifiers jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb, p_modifiers jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb, p_modifiers jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.delete_menu_item_photo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_menu_item_photo() TO anon;
GRANT EXECUTE ON FUNCTION public.delete_menu_item_photo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_menu_item_photo() TO service_role;
REVOKE ALL ON FUNCTION public.delivery_date(ts timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delivery_date(ts timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.delivery_date(ts timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_date(ts timestamp with time zone) TO service_role;
REVOKE ALL ON FUNCTION public.get_anniversary_customers(p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_anniversary_customers(p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_delivery_metrics_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_delivery_metrics_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.get_delivery_metrics_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_metrics_admin() TO service_role;
REVOKE ALL ON FUNCTION public.get_driver_latest_location(p_driver_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_latest_location(p_driver_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_driver_latest_location(p_driver_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_latest_location(p_driver_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_driver_performance(p_driver_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_performance(p_driver_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_driver_performance(p_driver_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_performance(p_driver_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_driver_stats_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_stats_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.get_driver_stats_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_stats_admin() TO service_role;
REVOKE ALL ON FUNCTION public.get_expiring_loyalty_rewards(p_days integer, p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_expiring_loyalty_rewards(p_days integer, p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_lapsed_customers(p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lapsed_customers(p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_loyalty_thankyou_candidates(p_limit integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_loyalty_thankyou_candidates(p_limit integer) TO service_role;
REVOKE ALL ON FUNCTION public.get_loyalty_tier_distribution() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_loyalty_tier_distribution() TO service_role;
REVOKE ALL ON FUNCTION public.get_my_driver_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_driver_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_driver_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_driver_id() TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
REVOKE ALL ON FUNCTION public.is_driver() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_driver() TO anon;
GRANT EXECUTE ON FUNCTION public.is_driver() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_driver() TO service_role;
REVOKE ALL ON FUNCTION public.merge_routes(p_destination_route_id uuid, p_source_route_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_routes(p_destination_route_id uuid, p_source_route_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.merge_routes(p_destination_route_id uuid, p_source_route_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_routes(p_destination_route_id uuid, p_source_route_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.prevent_duplicate_active_assignment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prevent_duplicate_active_assignment() TO anon;
GRANT EXECUTE ON FUNCTION public.prevent_duplicate_active_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_duplicate_active_assignment() TO service_role;
REVOKE ALL ON FUNCTION public.promote_next_stop(p_route_id uuid, p_completed_stop_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_next_stop(p_route_id uuid, p_completed_stop_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.promote_next_stop(p_route_id uuid, p_completed_stop_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_next_stop(p_route_id uuid, p_completed_stop_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.refresh_analytics_views() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views() TO anon;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views() TO service_role;
REVOKE ALL ON FUNCTION public.reindex_route_stops(p_route_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reindex_route_stops(p_route_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.reindex_route_stops(p_route_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reindex_route_stops(p_route_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.split_route(p_source_route_id uuid, p_stop_ids uuid[], p_new_driver_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.split_route(p_source_route_id uuid, p_stop_ids uuid[], p_new_driver_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.split_route(p_source_route_id uuid, p_stop_ids uuid[], p_new_driver_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.split_route(p_source_route_id uuid, p_stop_ids uuid[], p_new_driver_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.update_driver_deliveries_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_driver_deliveries_count() TO anon;
GRANT EXECUTE ON FUNCTION public.update_driver_deliveries_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_driver_deliveries_count() TO service_role;
REVOKE ALL ON FUNCTION public.update_driver_rating_avg() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_driver_rating_avg() TO anon;
GRANT EXECUTE ON FUNCTION public.update_driver_rating_avg() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_driver_rating_avg() TO service_role;
REVOKE ALL ON FUNCTION public.update_image_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_image_updated_at() TO anon;
GRANT EXECUTE ON FUNCTION public.update_image_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_image_updated_at() TO service_role;
REVOKE ALL ON FUNCTION public.update_route_stats(p_route_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_route_stats(p_route_id uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.update_route_stats(p_route_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_route_stats(p_route_id uuid) TO service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- Triggers --------------------------------------------------------------------
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER customer_feedback_updated_at BEFORE UPDATE ON public.customer_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_settings_updated_at BEFORE UPDATE ON public.customer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER delivery_days_updated_at BEFORE UPDATE ON public.delivery_days FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER delivery_zones_updated_at BEFORE UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_driver_rating AFTER INSERT OR DELETE OR UPDATE ON public.driver_ratings FOR EACH ROW EXECUTE FUNCTION update_driver_rating_avg();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_featured_sections_updated_at BEFORE UPDATE ON public.featured_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_delete_menu_item_photo BEFORE DELETE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION delete_menu_item_photo();
CREATE TRIGGER trg_menu_items_image_updated BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_image_updated_at();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_compute_refund_status AFTER UPDATE OF refunded_quantity ON public.order_items FOR EACH ROW EXECUTE FUNCTION compute_order_refund_status();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_prevent_duplicate_active_assignment BEFORE INSERT ON public.route_stops FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_active_assignment();
CREATE TRIGGER trg_update_driver_deliveries AFTER INSERT OR UPDATE ON public.route_stops FOR EACH ROW EXECUTE FUNCTION update_driver_deliveries_count();
CREATE TRIGGER update_route_stops_updated_at BEFORE UPDATE ON public.route_stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_check_route_completion BEFORE UPDATE ON public.routes FOR EACH ROW WHEN ((new.status = 'completed'::route_status)) EXECUTE FUNCTION check_route_completion();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes ---------------------------------------------------------------------
CREATE INDEX idx_addresses_user_id ON public.addresses USING btree (user_id);
CREATE INDEX idx_app_settings_category ON public.app_settings USING btree (category);
CREATE INDEX idx_app_settings_key ON public.app_settings USING btree (key);
CREATE INDEX idx_carts_abandoned ON public.carts USING btree (updated_at) WHERE (item_count > 0);
CREATE INDEX idx_customer_feedback_category ON public.customer_feedback USING btree (category);
CREATE INDEX idx_customer_feedback_created_at ON public.customer_feedback USING btree (created_at DESC);
CREATE INDEX idx_customer_feedback_status ON public.customer_feedback USING btree (status);
CREATE INDEX idx_customer_feedback_user_id ON public.customer_feedback USING btree (user_id);
CREATE INDEX idx_delivery_exceptions_resolved_by ON public.delivery_exceptions USING btree (resolved_by);
CREATE INDEX idx_delivery_exceptions_stop ON public.delivery_exceptions USING btree (route_stop_id);
CREATE INDEX idx_delivery_exceptions_unresolved ON public.delivery_exceptions USING btree (route_stop_id) WHERE (resolved_at IS NULL);
CREATE UNIQUE INDEX idx_delivery_metrics_mv_date ON public.delivery_metrics_mv USING btree (delivery_date);
CREATE INDEX idx_driver_badges_driver_id ON public.driver_badges USING btree (driver_id);
CREATE INDEX idx_driver_invites_email ON public.driver_invites USING btree (email);
CREATE INDEX idx_driver_ratings_driver ON public.driver_ratings USING btree (driver_id);
CREATE INDEX idx_driver_ratings_order ON public.driver_ratings USING btree (order_id);
CREATE INDEX idx_driver_ratings_stop ON public.driver_ratings USING btree (route_stop_id);
CREATE INDEX idx_driver_ratings_submitted ON public.driver_ratings USING btree (submitted_at DESC);
CREATE UNIQUE INDEX idx_driver_stats_mv_driver_id ON public.driver_stats_mv USING btree (driver_id);
CREATE INDEX idx_drivers_active ON public.drivers USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_drivers_user_id ON public.drivers USING btree (user_id);
CREATE INDEX idx_featured_section_items_item ON public.featured_section_items USING btree (item_id);
CREATE INDEX idx_featured_section_items_section ON public.featured_section_items USING btree (section_id, sort_order);
CREATE INDEX idx_featured_sections_slug ON public.featured_sections USING btree (slug);
CREATE INDEX idx_featured_sections_sort ON public.featured_sections USING btree (sort_order);
CREATE INDEX idx_featured_sections_visible ON public.featured_sections USING btree (is_visible) WHERE ((is_visible = true) AND (deleted_at IS NULL));
CREATE INDEX idx_item_modifier_groups_group ON public.item_modifier_groups USING btree (group_id);
CREATE INDEX idx_item_modifier_groups_item ON public.item_modifier_groups USING btree (item_id);
CREATE INDEX idx_location_updates_driver_time ON public.location_updates USING btree (driver_id, recorded_at DESC);
CREATE INDEX idx_location_updates_route ON public.location_updates USING btree (route_id, recorded_at DESC);
CREATE INDEX idx_loyalty_rewards_code ON public.loyalty_rewards USING btree (reward_code) WHERE (reward_code IS NOT NULL);
CREATE INDEX idx_loyalty_rewards_expiring ON public.loyalty_rewards USING btree (expires_at) WHERE ((redeemed_at IS NULL) AND (reminded_at IS NULL));
CREATE INDEX idx_loyalty_rewards_user ON public.loyalty_rewards USING btree (user_id);
CREATE INDEX idx_menu_categories_sort ON public.menu_categories USING btree (sort_order);
CREATE INDEX idx_menu_items_active ON public.menu_items USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_menu_items_active_name ON public.menu_items USING btree (name_en) WHERE (is_active = true);
CREATE INDEX idx_menu_items_category ON public.menu_items USING btree (category_id);
CREATE INDEX idx_modifier_options_group ON public.modifier_options USING btree (group_id);
CREATE INDEX idx_notification_logs_created ON public.notification_logs USING btree (created_at DESC);
CREATE INDEX idx_notification_logs_order ON public.notification_logs USING btree (order_id);
CREATE INDEX idx_notification_logs_order_created ON public.notification_logs USING btree (order_id, created_at DESC);
CREATE INDEX idx_notification_logs_resend_id ON public.notification_logs USING btree (resend_id) WHERE (resend_id IS NOT NULL);
CREATE INDEX idx_notification_logs_status ON public.notification_logs USING btree (status);
CREATE INDEX idx_notification_logs_status_created ON public.notification_logs USING btree (status, created_at DESC);
CREATE INDEX idx_notification_logs_type ON public.notification_logs USING btree (notification_type);
CREATE INDEX idx_notification_logs_user ON public.notification_logs USING btree (user_id);
CREATE INDEX idx_order_audit_log_actor_id ON public.order_audit_log USING btree (actor_id);
CREATE INDEX idx_order_audit_log_created_at ON public.order_audit_log USING btree (created_at DESC);
CREATE INDEX idx_order_audit_log_order_id ON public.order_audit_log USING btree (order_id);
CREATE INDEX idx_order_item_modifiers_item ON public.order_item_modifiers USING btree (order_item_id);
CREATE INDEX idx_order_item_modifiers_option ON public.order_item_modifiers USING btree (modifier_option_id);
CREATE INDEX idx_order_items_menu_item ON public.order_items USING btree (menu_item_id);
CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX idx_orders_active_status ON public.orders USING btree (status, placed_at DESC) WHERE (status <> ALL (ARRAY['delivered'::order_status, 'cancelled'::order_status, 'pending'::order_status]));
CREATE INDEX idx_orders_address ON public.orders USING btree (address_id);
CREATE INDEX idx_orders_assigned_driver ON public.orders USING btree (assigned_driver_id) WHERE (assigned_driver_id IS NOT NULL);
CREATE INDEX idx_orders_needs_contact ON public.orders USING btree (needs_contact) WHERE (needs_contact = true);
CREATE INDEX idx_orders_payment_method_status ON public.orders USING btree (payment_method, status) WHERE (payment_method = 'cod'::text);
CREATE INDEX idx_orders_placed_at ON public.orders USING btree (placed_at DESC);
CREATE INDEX idx_orders_refund_status ON public.orders USING btree (refund_status) WHERE (refund_status <> 'none'::text);
CREATE INDEX idx_orders_share_token ON public.orders USING btree (share_token) WHERE (share_token IS NOT NULL);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_status_placed ON public.orders USING btree (status, placed_at DESC);
CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);
CREATE INDEX idx_orders_user_placed_id ON public.orders USING btree (user_id, placed_at DESC, id DESC);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);
CREATE INDEX idx_referrals_referrer ON public.referrals USING btree (referrer_id);
CREATE INDEX idx_route_stops_order ON public.route_stops USING btree (order_id);
CREATE INDEX idx_route_stops_order_route ON public.route_stops USING btree (order_id, route_id);
CREATE INDEX idx_route_stops_route ON public.route_stops USING btree (route_id, stop_index);
CREATE INDEX idx_route_stops_status ON public.route_stops USING btree (status);
CREATE INDEX idx_routes_date ON public.routes USING btree (delivery_date);
CREATE INDEX idx_routes_date_status ON public.routes USING btree (delivery_date, status);
CREATE INDEX idx_routes_driver ON public.routes USING btree (driver_id);
CREATE INDEX idx_routes_driver_date ON public.routes USING btree (driver_id, delivery_date) WHERE (driver_id IS NOT NULL);
CREATE INDEX idx_routes_status ON public.routes USING btree (status);
CREATE INDEX idx_webhook_audit_created ON public.webhook_audit_logs USING btree (created_at DESC);
CREATE INDEX idx_webhook_audit_svix_id ON public.webhook_audit_logs USING btree (svix_id);
CREATE INDEX idx_webhook_events_event_id ON public.webhook_events USING btree (event_id);

-- Row level security ----------------------------------------------------------
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Policies (public) -----------------------------------------------------------
CREATE POLICY addresses_delete ON public.addresses AS PERMISSIVE FOR DELETE TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY addresses_insert ON public.addresses AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY addresses_select ON public.addresses AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY addresses_update ON public.addresses AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY app_settings_admin_insert ON public.app_settings AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY app_settings_admin_update ON public.app_settings AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY app_settings_select ON public.app_settings AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY carts_delete ON public.carts AS PERMISSIVE FOR DELETE TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY carts_insert ON public.carts AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY carts_select ON public.carts AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY carts_update ON public.carts AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY customer_feedback_insert ON public.customer_feedback AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY customer_feedback_select_admin ON public.customer_feedback AS PERMISSIVE FOR SELECT TO public
  USING (is_admin());

CREATE POLICY customer_feedback_select_own ON public.customer_feedback AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY customer_feedback_update_admin ON public.customer_feedback AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY customer_settings_insert ON public.customer_settings AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY customer_settings_select ON public.customer_settings AS PERMISSIVE FOR SELECT TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin)));

CREATE POLICY customer_settings_update ON public.customer_settings AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin)))
  WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin() AS is_admin)));

CREATE POLICY admin_delivery_days_all ON public.delivery_days AS PERMISSIVE FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY anon_delivery_days_select ON public.delivery_days AS PERMISSIVE FOR SELECT TO anon
  USING ((is_active = true));

CREATE POLICY authenticated_delivery_days_select ON public.delivery_days AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_active = true));

CREATE POLICY delivery_exceptions_delete ON public.delivery_exceptions AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY delivery_exceptions_insert ON public.delivery_exceptions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (route_stops rs
     JOIN routes r ON ((rs.route_id = r.id)))
  WHERE ((rs.id = delivery_exceptions.route_stop_id) AND (r.driver_id = get_my_driver_id())))));

CREATE POLICY delivery_exceptions_select ON public.delivery_exceptions AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM (route_stops rs
     JOIN routes r ON ((rs.route_id = r.id)))
  WHERE ((rs.id = delivery_exceptions.route_stop_id) AND (r.driver_id = get_my_driver_id())))) OR is_admin()));

CREATE POLICY delivery_exceptions_update ON public.delivery_exceptions AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY delivery_zones_admin_all ON public.delivery_zones AS PERMISSIVE FOR ALL TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY delivery_zones_read_all ON public.delivery_zones AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY driver_badges_delete_admin ON public.driver_badges AS PERMISSIVE FOR DELETE TO public
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY driver_badges_insert_admin ON public.driver_badges AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (( SELECT is_admin() AS is_admin));

CREATE POLICY driver_badges_select_admin ON public.driver_badges AS PERMISSIVE FOR SELECT TO public
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY driver_badges_select_own ON public.driver_badges AS PERMISSIVE FOR SELECT TO public
  USING ((driver_id = ( SELECT get_my_driver_id() AS get_my_driver_id)));

CREATE POLICY driver_badges_update_admin ON public.driver_badges AS PERMISSIVE FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin))
  WITH CHECK (( SELECT is_admin() AS is_admin));

CREATE POLICY driver_invites_admin ON public.driver_invites AS PERMISSIVE FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY driver_invites_user_read ON public.driver_invites AS PERMISSIVE FOR SELECT TO authenticated
  USING ((email = (auth.jwt() ->> 'email'::text)));

CREATE POLICY driver_ratings_delete ON public.driver_ratings AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY driver_ratings_insert ON public.driver_ratings AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (orders o
     JOIN route_stops rs ON ((rs.order_id = o.id)))
  WHERE ((o.id = driver_ratings.order_id) AND (o.user_id = ( SELECT auth.uid() AS uid)) AND (rs.status = 'delivered'::route_stop_status)))));

CREATE POLICY driver_ratings_select ON public.driver_ratings AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = driver_ratings.order_id) AND (orders.user_id = ( SELECT auth.uid() AS uid))))) OR (driver_id = get_my_driver_id()) OR is_admin()));

CREATE POLICY driver_ratings_update ON public.driver_ratings AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY drivers_delete ON public.drivers AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY drivers_insert ON public.drivers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY drivers_select ON public.drivers AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY drivers_update ON public.drivers AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY featured_section_items_delete ON public.featured_section_items AS PERMISSIVE FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY featured_section_items_insert ON public.featured_section_items AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_admin() AS is_admin));

CREATE POLICY featured_section_items_select ON public.featured_section_items AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM featured_sections fs
  WHERE ((fs.id = featured_section_items.section_id) AND ((fs.is_visible = true) AND (fs.deleted_at IS NULL))))) OR ( SELECT is_admin() AS is_admin)));

CREATE POLICY featured_section_items_update ON public.featured_section_items AS PERMISSIVE FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY featured_sections_delete ON public.featured_sections AS PERMISSIVE FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY featured_sections_insert ON public.featured_sections AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_admin() AS is_admin));

CREATE POLICY featured_sections_select ON public.featured_sections AS PERMISSIVE FOR SELECT TO public
  USING ((((is_visible = true) AND (deleted_at IS NULL)) OR ( SELECT is_admin() AS is_admin)));

CREATE POLICY featured_sections_update ON public.featured_sections AS PERMISSIVE FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY item_modifier_groups_delete ON public.item_modifier_groups AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY item_modifier_groups_insert ON public.item_modifier_groups AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY item_modifier_groups_select ON public.item_modifier_groups AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY item_modifier_groups_update ON public.item_modifier_groups AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY location_updates_insert ON public.location_updates AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((driver_id = get_my_driver_id()));

CREATE POLICY location_updates_select ON public.location_updates AS PERMISSIVE FOR SELECT TO public
  USING (((driver_id = get_my_driver_id()) OR (EXISTS ( SELECT 1
   FROM ((route_stops rs
     JOIN routes r ON ((rs.route_id = r.id)))
     JOIN orders o ON ((rs.order_id = o.id)))
  WHERE ((o.user_id = ( SELECT auth.uid() AS uid)) AND (r.status = 'in_progress'::route_status) AND (location_updates.route_id = r.id)))) OR is_admin()));

CREATE POLICY loyalty_rewards_select ON public.loyalty_rewards AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY menu_categories_delete ON public.menu_categories AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY menu_categories_insert ON public.menu_categories AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY menu_categories_select ON public.menu_categories AS PERMISSIVE FOR SELECT TO public
  USING (((is_active = true) OR is_admin()));

CREATE POLICY menu_categories_update ON public.menu_categories AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY menu_items_delete ON public.menu_items AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY menu_items_insert ON public.menu_items AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY menu_items_select ON public.menu_items AS PERMISSIVE FOR SELECT TO public
  USING (((is_active = true) OR is_admin()));

CREATE POLICY menu_items_update ON public.menu_items AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY modifier_groups_delete ON public.modifier_groups AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY modifier_groups_insert ON public.modifier_groups AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY modifier_groups_select ON public.modifier_groups AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY modifier_groups_update ON public.modifier_groups AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY modifier_options_delete ON public.modifier_options AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY modifier_options_insert ON public.modifier_options AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY modifier_options_select ON public.modifier_options AS PERMISSIVE FOR SELECT TO public
  USING (true);

CREATE POLICY modifier_options_update ON public.modifier_options AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY notification_logs_delete ON public.notification_logs AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY notification_logs_insert ON public.notification_logs AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY notification_logs_select ON public.notification_logs AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY notification_logs_update ON public.notification_logs AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY order_audit_log_insert ON public.order_audit_log AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_admin() AS is_admin));

CREATE POLICY order_audit_log_select ON public.order_audit_log AS PERMISSIVE FOR SELECT TO authenticated
  USING (( SELECT is_admin() AS is_admin));

CREATE POLICY order_item_modifiers_insert ON public.order_item_modifiers AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (order_items
     JOIN orders ON ((orders.id = order_items.order_id)))
  WHERE ((order_items.id = order_item_modifiers.order_item_id) AND (orders.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY order_item_modifiers_select ON public.order_item_modifiers AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM (order_items
     JOIN orders ON ((orders.id = order_items.order_id)))
  WHERE ((order_items.id = order_item_modifiers.order_item_id) AND (orders.user_id = ( SELECT auth.uid() AS uid))))) OR is_admin()));

CREATE POLICY order_items_insert ON public.order_items AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY order_items_select ON public.order_items AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = ( SELECT auth.uid() AS uid))))) OR is_admin()));

CREATE POLICY orders_insert ON public.orders AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY orders_select ON public.orders AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY orders_update ON public.orders AS PERMISSIVE FOR UPDATE TO public
  USING (is_admin());

CREATE POLICY profiles_insert_own ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO public
  USING (((id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO public
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY push_subscriptions_delete ON public.push_subscriptions AS PERMISSIVE FOR DELETE TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY push_subscriptions_insert ON public.push_subscriptions AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY push_subscriptions_select ON public.push_subscriptions AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY referrals_select ON public.referrals AS PERMISSIVE FOR SELECT TO public
  USING (((referrer_id = ( SELECT auth.uid() AS uid)) OR (referee_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

CREATE POLICY route_stops_delete ON public.route_stops AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY route_stops_insert ON public.route_stops AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY route_stops_select ON public.route_stops AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM routes r
  WHERE ((r.id = route_stops.route_id) AND (r.driver_id = get_my_driver_id())))) OR (EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = route_stops.order_id) AND (o.user_id = ( SELECT auth.uid() AS uid))))) OR is_admin()));

CREATE POLICY route_stops_update ON public.route_stops AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM routes r
  WHERE ((r.id = route_stops.route_id) AND (r.driver_id = get_my_driver_id())))) OR is_admin()));

CREATE POLICY routes_delete ON public.routes AS PERMISSIVE FOR DELETE TO public
  USING (is_admin());

CREATE POLICY routes_insert ON public.routes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (is_admin());

CREATE POLICY routes_select ON public.routes AS PERMISSIVE FOR SELECT TO public
  USING (((driver_id = get_my_driver_id()) OR is_admin()));

CREATE POLICY routes_update ON public.routes AS PERMISSIVE FOR UPDATE TO public
  USING (((driver_id = get_my_driver_id()) OR is_admin()))
  WITH CHECK (((driver_id = get_my_driver_id()) OR is_admin()));

-- Policies (storage) ----------------------------------------------------------
CREATE POLICY delivery_photos_delete ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'delivery-photos'::text) AND (EXISTS ( SELECT 1
   FROM (routes r
     JOIN drivers d ON ((r.driver_id = d.id)))
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND (r.status = 'in_progress'::route_status) AND ((storage.foldername(objects.name))[1] = (r.id)::text))))));

CREATE POLICY delivery_photos_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'delivery-photos'::text) AND (EXISTS ( SELECT 1
   FROM (routes r
     JOIN drivers d ON ((r.driver_id = d.id)))
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND ((storage.foldername(objects.name))[1] = (r.id)::text))))));

CREATE POLICY delivery_photos_select ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'delivery-photos'::text) AND (is_admin() OR (EXISTS ( SELECT 1
   FROM (routes r
     JOIN drivers d ON ((r.driver_id = d.id)))
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND ((storage.foldername(objects.name))[1] = (r.id)::text)))))));

CREATE POLICY driver_photos_delete ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'driver-photos'::text) AND (is_admin() OR (EXISTS ( SELECT 1
   FROM drivers d
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND ((storage.foldername(objects.name))[1] = (d.id)::text)))))));

CREATE POLICY driver_photos_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'driver-photos'::text) AND (EXISTS ( SELECT 1
   FROM drivers d
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND (d.is_active = true) AND ((storage.foldername(objects.name))[1] = (d.id)::text))))));

CREATE POLICY driver_photos_select ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING ((bucket_id = 'driver-photos'::text));

CREATE POLICY driver_photos_update ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'driver-photos'::text) AND (EXISTS ( SELECT 1
   FROM drivers d
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND (d.is_active = true) AND ((storage.foldername(objects.name))[1] = (d.id)::text))))))
  WITH CHECK (((bucket_id = 'driver-photos'::text) AND (EXISTS ( SELECT 1
   FROM drivers d
  WHERE ((d.user_id = ( SELECT auth.uid() AS uid)) AND (d.is_active = true) AND ((storage.foldername(objects.name))[1] = (d.id)::text))))));

CREATE POLICY feedback_attachments_read ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING ((bucket_id = 'feedback-attachments'::text));

CREATE POLICY feedback_attachments_upload ON storage.objects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((bucket_id = 'feedback-attachments'::text));

CREATE POLICY menu_photos_delete ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'menu-photos'::text) AND is_admin()));

CREATE POLICY menu_photos_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'menu-photos'::text) AND is_admin()));

CREATE POLICY menu_photos_select ON storage.objects AS PERMISSIVE FOR SELECT TO public
  USING ((bucket_id = 'menu-photos'::text));

CREATE POLICY menu_photos_update ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'menu-photos'::text) AND is_admin()))
  WITH CHECK (((bucket_id = 'menu-photos'::text) AND is_admin()));

-- Table privileges ------------------------------------------------------------
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.addresses TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.addresses TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.addresses TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_settings TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_settings TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.app_settings TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.carts TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.carts TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.carts TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_feedback TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_feedback TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_feedback TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_settings TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_settings TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.customer_settings TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_days TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_days TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_days TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_exceptions TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_exceptions TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_exceptions TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_zones TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_zones TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.delivery_zones TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_badges TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_badges TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_badges TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_invites TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_invites TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_invites TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_ratings TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_ratings TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.driver_ratings TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.drivers TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.drivers TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.drivers TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.featured_section_items TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.featured_section_items TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.featured_section_items TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.featured_sections TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.featured_sections TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.featured_sections TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.item_modifier_groups TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.item_modifier_groups TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.item_modifier_groups TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.location_updates TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.location_updates TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.location_updates TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.loyalty_rewards TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_categories TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_categories TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_categories TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.menu_items TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.modifier_groups TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.modifier_groups TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.modifier_groups TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.modifier_options TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.modifier_options TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.modifier_options TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notification_logs TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notification_logs TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.notification_logs TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_audit_log TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_audit_log TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_audit_log TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_item_modifiers TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_item_modifiers TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_item_modifiers TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_items TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_items TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.order_items TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orders TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orders TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.orders TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pg_all_foreign_keys TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pg_all_foreign_keys TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.pg_all_foreign_keys TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.profiles TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.push_subscriptions TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.push_subscriptions TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.push_subscriptions TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.referrals TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.referrals TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.referrals TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.route_stops TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.route_stops TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.route_stops TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.routes TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.routes TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.routes TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tap_funky TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tap_funky TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.tap_funky TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.webhook_audit_logs TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.webhook_audit_logs TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.webhook_audit_logs TO service_role;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.webhook_events TO anon;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.webhook_events TO authenticated;
GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE public.webhook_events TO service_role;

-- Storage buckets -------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('delivery-photos','delivery-photos',false,5242880,ARRAY['image/jpeg','image/png','image/webp']),
  ('driver-photos','driver-photos',true,5242880,ARRAY['image/jpeg','image/png','image/webp']),
  ('feedback-attachments','feedback-attachments',true,5242880,ARRAY['image/jpeg','image/png','image/webp']),
  ('menu-photos','menu-photos',true,10485760,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
