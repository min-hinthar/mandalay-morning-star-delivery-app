# docs/04-data-model.md (v1.0) — Supabase Postgres + RLS-first

## Principles
- RLS-first: customers only see their data.
- Server is source of truth for prices, fees, coverage validation.
- Menu item prices snapshotted into order_items at purchase time.

## Tables (Core)

### auth.users (Supabase)
- managed by Supabase Auth

### profiles
- id (uuid, pk) = auth.user.id
- role (enum: customer|admin|driver)
- full_name (text)
- phone (text)
- created_at, updated_at

### addresses
- id (uuid pk)
- user_id (uuid fk -> profiles.id)
- label (text) — “Home”, “Work”
- line1, line2, city, state, postal_code
- lat (numeric), lng (numeric)
- coverage_valid (bool)
- distance_miles (numeric)
- duration_minutes (numeric)
- last_validated_at (timestamptz)
- created_at, updated_at

### menu_categories
- id (uuid pk)
- name (text) — “Noodles”
- slug (text unique)
- sort_order (int)
- is_active (bool)
- created_at, updated_at

### menu_items
- id (uuid pk)
- category_id (uuid fk -> menu_categories.id)
- name (text)
- description (text)
- image_url (text)
- base_price_cents (int)
- is_active (bool)
- is_sold_out (bool)
- tags (text[]) — optional
- created_at, updated_at

### modifier_groups
- id (uuid pk)
- name (text) — “Protein Choice”
- selection_type (enum: single|multiple)
- min_select (int)
- max_select (int)
- sort_order (int)
- created_at, updated_at

### modifier_options
- id (uuid pk)
- group_id (uuid fk -> modifier_groups.id)
- name (text) — “Chicken”
- price_delta_cents (int) — can be 0
- is_active (bool)
- sort_order (int)
- created_at, updated_at

### menu_item_modifier_groups (join)
- menu_item_id (uuid fk -> menu_items.id)
- group_id (uuid fk -> modifier_groups.id)
- sort_order (int)

### orders
- id (uuid pk)
- user_id (uuid fk -> profiles.id)
- address_id (uuid fk -> addresses.id)
- scheduled_date (date) — Saturday
- time_window_start (time)
- time_window_end (time)
- cutoff_at (timestamptz) — Friday 15:00 PT for scheduled Saturday
- status (enum: draft|pending_payment|paid|confirmed|in_kitchen|out_for_delivery|delivered|canceled|refunded)
- currency (text default 'usd')
- items_subtotal_cents (int)
- delivery_fee_cents (int)
- tax_cents (int)
- tip_cents (int)
- discount_cents (int)
- total_cents (int)
- customer_notes (text)
- internal_notes (text)
- stripe_customer_id (text)
- stripe_checkout_session_id (text)
- stripe_payment_intent_id (text)
- created_at, updated_at

### order_items
- id (uuid pk)
- order_id (uuid fk -> orders.id)
- menu_item_id (uuid fk -> menu_items.id, nullable) — keep nullable to survive deletes
- name_snapshot (text)
- unit_price_cents_snapshot (int)
- quantity (int)
- created_at

### order_item_modifiers
- id (uuid pk)
- order_item_id (uuid fk -> order_items.id)
- modifier_option_id (uuid fk -> modifier_options.id, nullable)
- name_snapshot (text)
- price_delta_cents_snapshot (int)
- created_at

### payments (optional but recommended)
- id (uuid pk)
- order_id (uuid fk -> orders.id)
- provider (text = 'stripe')
- stripe_payment_intent_id (text)
- amount_cents (int)
- status (text)
- created_at

### refunds
- id (uuid pk)
- order_id (uuid fk -> orders.id)
- stripe_refund_id (text)
- amount_cents (int)
- reason (text)
- created_at

## Delivery Ops (Tracking)

### drivers
- id (uuid pk) — can link to profiles.id where role=driver
- user_id (uuid fk -> profiles.id)
- is_active (bool)

### routes
- id (uuid pk)
- delivery_date (date) — Saturday
- driver_id (uuid fk -> drivers.id)
- status (enum: planned|in_progress|completed)
- optimized_polyline (text)
- stats_json (jsonb) — total miles, duration, etc
- created_at, updated_at

### route_stops
- id (uuid pk)
- route_id (uuid fk -> routes.id)
- order_id (uuid fk -> orders.id)
- stop_index (int)
- eta (timestamptz, nullable)
- status (enum: pending|enroute|arrived|delivered|skipped)
- created_at, updated_at

### driver_location_updates
- id (uuid pk)
- driver_id (uuid fk -> drivers.id)
- lat (numeric)
- lng (numeric)
- recorded_at (timestamptz)
- source (text) — mobile|admin

## RLS (High-Level)
- profiles: user can read/write own; admins can read all
- addresses: user can CRUD own; admins read all
- menu_*: public read active items/categories; admin CRUD
- orders: user can read own; user can create draft; user can update draft until cutoff; admin read/manage all
- route_*: drivers can read assigned routes/stops; admin manages all
- driver_location_updates: driver can insert own; customers read only the location for their active order’s route (via secure join/view)

## Performance
- indexes:
  - orders(user_id, scheduled_date)
  - menu_items(category_id, is_active, is_sold_out)
  - addresses(user_id)
  - route_stops(route_id, stop_index)