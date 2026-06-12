-- Phase 2 of the create_order_with_items lockdown.
--
-- The checkout route now invokes the RPC with the service client, so the
-- `authenticated` grant is unused by the app. Revoking it closes the remaining
-- hole: a logged-in user calling the RPC directly via PostgREST to create
-- orders for themselves with self-chosen prices (COD never passes through
-- Stripe, so forged totals would otherwise reach admin approval).
--
-- Deploy note: apply this only once the app deploy containing the
-- service-client switch (same PR) is live; the previous deployed app called
-- this RPC with the user-scoped client.

REVOKE EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb, jsonb) FROM authenticated;
