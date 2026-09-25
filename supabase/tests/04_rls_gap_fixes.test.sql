-- ===========================================
-- pgTAP Tests: pre-existing RLS gap fixes (20260925180000)
-- Behavioural: each case replays the app's write/read as the real role inside
-- this rolled-back transaction, then asserts as postgres.
-- ===========================================
BEGIN;
SELECT plan(14);

-- Fixtures (as postgres) ------------------------------------------------------
INSERT INTO auth.users (id, instance_id, aud, role, email) VALUES
  ('a4000000-0000-4000-8000-0000000000ad', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rg-admin@example.test'),
  ('a4000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rg-cust1@example.test'),
  ('a4000000-0000-4000-8000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rg-cust2@example.test'),
  ('a4000000-0000-4000-8000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rg-drv1@example.test');
INSERT INTO public.profiles (id, email, role) VALUES
  ('a4000000-0000-4000-8000-0000000000ad', 'rg-admin@example.test', 'admin'),
  ('a4000000-0000-4000-8000-0000000000c1', 'rg-cust1@example.test', 'customer'),
  ('a4000000-0000-4000-8000-0000000000c2', 'rg-cust2@example.test', 'customer'),
  ('a4000000-0000-4000-8000-0000000000d1', 'rg-drv1@example.test', 'driver')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
INSERT INTO public.drivers (id, user_id, is_active) VALUES
  ('a4000000-0000-4000-8000-0000000000dd', 'a4000000-0000-4000-8000-0000000000d1', true);
INSERT INTO public.addresses (id, user_id, line_1, city, postal_code) VALUES
  ('a4000000-0000-4000-8000-00000000a0a1', 'a4000000-0000-4000-8000-0000000000c1', '1 On Route St', 'Covina', '91723'),
  ('a4000000-0000-4000-8000-00000000a0a2', 'a4000000-0000-4000-8000-0000000000c1', '2 Not Routed St', 'Covina', '91723'),
  ('a4000000-0000-4000-8000-00000000a0b1', 'a4000000-0000-4000-8000-0000000000c2', '3 Other Cust St', 'Covina', '91723');
INSERT INTO public.orders (id, user_id, address_id, status, payment_method, subtotal_cents, delivery_fee_cents, tax_cents, total_cents) VALUES
  ('a4000000-0000-4000-8000-0000000000e1', 'a4000000-0000-4000-8000-0000000000c1', 'a4000000-0000-4000-8000-00000000a0a1', 'confirmed', 'cod', 2000, 0, 0, 2000),
  ('a4000000-0000-4000-8000-0000000000e2', 'a4000000-0000-4000-8000-0000000000c1', 'a4000000-0000-4000-8000-00000000a0a1', 'confirmed', 'cod', 1000, 0, 0, 1000);
INSERT INTO public.order_items (id, order_id, name_snapshot, base_price_snapshot, quantity, line_total_cents) VALUES
  ('a4000000-0000-4000-8000-00000000f001', 'a4000000-0000-4000-8000-0000000000e1', 'Mohinga', 1000, 2, 2000);
INSERT INTO public.routes (id, delivery_date, driver_id, status) VALUES
  ('a4000000-0000-4000-8000-00000000b001', current_date, 'a4000000-0000-4000-8000-0000000000dd', 'assigned');
INSERT INTO public.route_stops (id, route_id, order_id, stop_index) VALUES
  ('a4000000-0000-4000-8000-00000000b101', 'a4000000-0000-4000-8000-00000000b001', 'a4000000-0000-4000-8000-0000000000e1', 0),
  ('a4000000-0000-4000-8000-00000000b102', 'a4000000-0000-4000-8000-00000000b001', 'a4000000-0000-4000-8000-0000000000e2', 1);

CREATE TEMP TABLE rg_res (k text PRIMARY KEY, v text);
GRANT ALL ON rg_res TO authenticated;

-- Customer: cannot edit or delete their own line items -------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
WITH u AS (UPDATE public.order_items SET quantity = 9 WHERE id = 'a4000000-0000-4000-8000-00000000f001' RETURNING 1)
  INSERT INTO rg_res SELECT 'cust_item_update', count(*)::text FROM u;
WITH d AS (DELETE FROM public.order_items WHERE id = 'a4000000-0000-4000-8000-00000000f001' RETURNING 1)
  INSERT INTO rg_res SELECT 'cust_item_delete', count(*)::text FROM d;
INSERT INTO rg_res SELECT 'cust_own_addresses', count(*)::text FROM public.addresses WHERE user_id = 'a4000000-0000-4000-8000-0000000000c1';
INSERT INTO rg_res SELECT 'cust_other_address', count(*)::text FROM public.addresses WHERE id = 'a4000000-0000-4000-8000-00000000a0b1';
RESET ROLE;

-- Active driver: sees exactly the on-route address -----------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
INSERT INTO rg_res SELECT 'drv_route_address', count(*)::text FROM public.addresses WHERE id = 'a4000000-0000-4000-8000-00000000a0a1';
INSERT INTO rg_res SELECT 'drv_unrouted_addresses', count(*)::text FROM public.addresses WHERE id IN ('a4000000-0000-4000-8000-00000000a0a2', 'a4000000-0000-4000-8000-00000000a0b1');
INSERT INTO rg_res SELECT 'drv_embed_line1', a.line_1 FROM public.route_stops rs
  JOIN public.orders o ON o.id = rs.order_id LEFT JOIN public.addresses a ON a.id = o.address_id
 WHERE rs.id = 'a4000000-0000-4000-8000-00000000b101';
RESET ROLE;

-- Deactivated driver: sees none -----------------------------------------------
UPDATE public.drivers SET is_active = false WHERE id = 'a4000000-0000-4000-8000-0000000000dd';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
INSERT INTO rg_res SELECT 'inactive_drv_address', count(*)::text FROM public.addresses WHERE id = 'a4000000-0000-4000-8000-00000000a0a1';
RESET ROLE;
UPDATE public.drivers SET is_active = true WHERE id = 'a4000000-0000-4000-8000-0000000000dd';

-- Admin: item edit + delete, split_route ---------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000ad","role":"authenticated"}', true);
WITH u AS (UPDATE public.order_items SET quantity = 1, line_total_cents = 1000 WHERE id = 'a4000000-0000-4000-8000-00000000f001' RETURNING 1)
  INSERT INTO rg_res SELECT 'admin_item_update', count(*)::text FROM u;
INSERT INTO rg_res SELECT 'admin_split_route',
  (public.split_route('a4000000-0000-4000-8000-00000000b001', ARRAY['a4000000-0000-4000-8000-00000000b102']::uuid[], NULL) IS NOT NULL)::text;
WITH d AS (DELETE FROM public.order_items WHERE id = 'a4000000-0000-4000-8000-00000000f001' RETURNING 1)
  INSERT INTO rg_res SELECT 'admin_item_delete', count(*)::text FROM d;
RESET ROLE;

SELECT is((SELECT v FROM rg_res WHERE k = 'cust_item_update'), '0', 'customer cannot UPDATE their order_items');
SELECT is((SELECT v FROM rg_res WHERE k = 'cust_item_delete'), '0', 'customer cannot DELETE their order_items');
SELECT is((SELECT v FROM rg_res WHERE k = 'cust_own_addresses'), '2', 'customer still reads own addresses');
SELECT is((SELECT v FROM rg_res WHERE k = 'cust_other_address'), '0', 'customer cannot read another customer''s address');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_route_address'), '1', 'driver reads the address of an order on their route');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_unrouted_addresses'), '0', 'driver cannot read addresses not on their routes');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_embed_line1'), '1 On Route St', 'driver route embed returns the street');
SELECT is((SELECT v FROM rg_res WHERE k = 'inactive_drv_address'), '0', 'deactivated driver reads no route addresses');
SELECT is((SELECT v FROM rg_res WHERE k = 'admin_item_update'), '1', 'admin can UPDATE order_items');
SELECT is((SELECT v FROM rg_res WHERE k = 'admin_item_delete'), '1', 'admin can DELETE order_items');
SELECT is((SELECT v FROM rg_res WHERE k = 'admin_split_route'), 'true', 'split_route returns a new route id for an admin');

-- Audit actions the app writes are accepted by the CHECK
SELECT lives_ok($$INSERT INTO public.order_audit_log (order_id, action, actor_id, actor_role, reason)
  VALUES ('a4000000-0000-4000-8000-0000000000e1', 'delivery_exception', 'a4000000-0000-4000-8000-0000000000d1', 'driver', 't')$$,
  'order_audit_log accepts delivery_exception');
SELECT lives_ok($$INSERT INTO public.order_audit_log (order_id, action, actor_id, actor_role, reason)
  SELECT 'a4000000-0000-4000-8000-0000000000e1', a, 'a4000000-0000-4000-8000-0000000000ad', 'admin', 't'
    FROM unnest(ARRAY['priority_change','update_items','assign_driver','unassign_driver','marked_contacted']) AS a$$,
  'order_audit_log accepts every admin route action');
SELECT throws_ok($$INSERT INTO public.order_audit_log (order_id, action, actor_id, actor_role, reason)
  VALUES ('a4000000-0000-4000-8000-0000000000e1', 'not_an_action', 'a4000000-0000-4000-8000-0000000000ad', 'admin', 't')$$,
  '23514', NULL, 'order_audit_log still rejects unknown actions');

SELECT * FROM finish();
ROLLBACK;
