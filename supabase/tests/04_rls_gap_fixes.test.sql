-- ===========================================
-- pgTAP Tests: pre-existing RLS gap fixes (20260925180000)
-- Behavioural: each case replays the app's write/read as the real role inside
-- this rolled-back transaction, then asserts as postgres.
-- ===========================================
BEGIN;
SELECT plan(26);

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

-- Live-route fixtures for §5–§8 ------------------------------------------------
INSERT INTO public.orders (id, user_id, address_id, status, payment_method, subtotal_cents, delivery_fee_cents, tax_cents, total_cents) VALUES
  ('a4000000-0000-4000-8000-0000000000e3', 'a4000000-0000-4000-8000-0000000000c1', 'a4000000-0000-4000-8000-00000000a0a1', 'out_for_delivery', 'cod', 1500, 0, 0, 1500),
  ('a4000000-0000-4000-8000-0000000000e4', 'a4000000-0000-4000-8000-0000000000c2', 'a4000000-0000-4000-8000-00000000a0b1', 'confirmed', 'cod', 900, 0, 0, 900);
INSERT INTO public.order_items (id, order_id, name_snapshot, base_price_snapshot, quantity, line_total_cents) VALUES
  ('a4000000-0000-4000-8000-00000000f003', 'a4000000-0000-4000-8000-0000000000e3', 'Shan Noodles', 1500, 1, 1500),
  ('a4000000-0000-4000-8000-00000000f004', 'a4000000-0000-4000-8000-0000000000e4', 'Tea Leaf Salad', 900, 1, 900);
INSERT INTO public.order_item_modifiers (order_item_id, name_snapshot) VALUES
  ('a4000000-0000-4000-8000-00000000f003', 'Extra chili'),
  ('a4000000-0000-4000-8000-00000000f004', 'No peanuts');
INSERT INTO public.routes (id, delivery_date, driver_id, status) VALUES
  ('a4000000-0000-4000-8000-00000000b002', current_date, 'a4000000-0000-4000-8000-0000000000dd', 'in_progress');
INSERT INTO public.route_stops (id, route_id, order_id, stop_index) VALUES
  ('a4000000-0000-4000-8000-00000000b201', 'a4000000-0000-4000-8000-00000000b002', 'a4000000-0000-4000-8000-0000000000e3', 0);
INSERT INTO public.location_updates (driver_id, route_id, latitude, longitude) VALUES
  ('a4000000-0000-4000-8000-0000000000dd', 'a4000000-0000-4000-8000-00000000b002', 34.09, -117.89);
INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth) VALUES
  ('a4000000-0000-4000-8000-0000000000c1', 'https://push.example.test/rg-c1', 'k', 'a');
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('delivery-photos', 'a4000000-0000-4000-8000-00000000b002/a4000000-0000-4000-8000-00000000b201.jpg'),
  ('delivery-photos', 'a4000000-0000-4000-8000-00000000b001/a4000000-0000-4000-8000-00000000b101.jpg');

-- Driver: bag contents on own route only; photo retake on the in-progress route only
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
INSERT INTO rg_res SELECT 'drv_route_items', count(*)::text FROM public.order_items WHERE order_id = 'a4000000-0000-4000-8000-0000000000e3';
INSERT INTO rg_res SELECT 'drv_route_modifiers', count(*)::text FROM public.order_item_modifiers WHERE order_item_id = 'a4000000-0000-4000-8000-00000000f003';
INSERT INTO rg_res SELECT 'drv_other_items', count(*)::text FROM public.order_items WHERE id = 'a4000000-0000-4000-8000-00000000f004';
INSERT INTO rg_res SELECT 'drv_other_modifiers', count(*)::text FROM public.order_item_modifiers WHERE order_item_id = 'a4000000-0000-4000-8000-00000000f004';
WITH u AS (UPDATE storage.objects SET metadata = '{"retake":true}'
             WHERE bucket_id = 'delivery-photos' AND name LIKE 'a4000000-0000-4000-8000-00000000b002/%' RETURNING 1)
  INSERT INTO rg_res SELECT 'drv_photo_retake_live', count(*)::text FROM u;
WITH u AS (UPDATE storage.objects SET metadata = '{"retake":true}'
             WHERE bucket_id = 'delivery-photos' AND name LIKE 'a4000000-0000-4000-8000-00000000b001/%' RETURNING 1)
  INSERT INTO rg_res SELECT 'drv_photo_retake_not_live', count(*)::text FROM u;
RESET ROLE;

-- Customer C1 (order out for delivery on the live route): sees the driver's location; can re-upsert own push endpoint
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
INSERT INTO rg_res SELECT 'cust_live_location', count(*)::text FROM public.location_updates WHERE route_id = 'a4000000-0000-4000-8000-00000000b002';
WITH u AS (INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
             VALUES ('a4000000-0000-4000-8000-0000000000c1', 'https://push.example.test/rg-c1', 'k2', 'a2')
           ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth RETURNING 1)
  INSERT INTO rg_res SELECT 'cust_push_resubscribe', count(*)::text FROM u;
RESET ROLE;

-- Customer C2 (nothing on that route): no location; cannot take over C1's endpoint
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
INSERT INTO rg_res SELECT 'other_cust_location', count(*)::text FROM public.location_updates WHERE route_id = 'a4000000-0000-4000-8000-00000000b002';
WITH u AS (UPDATE public.push_subscriptions SET user_id = 'a4000000-0000-4000-8000-0000000000c2'
             WHERE endpoint = 'https://push.example.test/rg-c1' RETURNING 1)
  INSERT INTO rg_res SELECT 'other_cust_push_takeover', count(*)::text FROM u;
RESET ROLE;

-- Once C1's order is delivered, the live location is no longer theirs to see
UPDATE public.orders SET status = 'delivered', delivered_at = now() WHERE id = 'a4000000-0000-4000-8000-0000000000e3';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"a4000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
INSERT INTO rg_res SELECT 'cust_location_after_delivery', count(*)::text FROM public.location_updates WHERE route_id = 'a4000000-0000-4000-8000-00000000b002';
RESET ROLE;

SELECT is((SELECT v FROM rg_res WHERE k = 'drv_route_items'), '1', 'driver sees the line items of an order on their route');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_route_modifiers'), '1', 'driver sees the modifiers of those items');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_other_items'), '0', 'driver cannot see line items of orders off their routes');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_other_modifiers'), '0', 'driver cannot see modifiers of orders off their routes');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_photo_retake_live'), '1', 'driver can overwrite a proof photo on their in-progress route');
SELECT is((SELECT v FROM rg_res WHERE k = 'drv_photo_retake_not_live'), '0', 'driver cannot overwrite a proof photo on a route that is not in progress');
SELECT is((SELECT v FROM rg_res WHERE k = 'cust_live_location'), '1', 'customer sees the driver location while their order is out for delivery');
SELECT is((SELECT v FROM rg_res WHERE k = 'other_cust_location'), '0', 'another customer cannot see that route''s location');
SELECT is((SELECT v FROM rg_res WHERE k = 'cust_location_after_delivery'), '0', 'customer stops seeing the location once their order is delivered');
SELECT is((SELECT v FROM rg_res WHERE k = 'cust_push_resubscribe'), '1', 'customer can re-upsert their own push endpoint');
SELECT is((SELECT v FROM rg_res WHERE k = 'other_cust_push_takeover'), '0', 'another customer cannot take over that push endpoint');
SELECT ok(NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_delete_menu_item_photo'),
  'menu_items has no SQL-side storage delete trigger (Storage API cleanup instead)');

SELECT * FROM finish();
ROLLBACK;
