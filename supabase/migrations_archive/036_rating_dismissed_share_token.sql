-- Migration 036: Rating Dismissed + Share Token columns on orders
-- Supports: CUX-12 (rating dismissal), CUX-13 (order sharing)

-- 1. Add rating_dismissed boolean for dismissing the rating prompt
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_dismissed BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add share_token for public order sharing links
ALTER TABLE orders ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- 3. Partial index on share_token (only non-null values)
CREATE INDEX IF NOT EXISTS idx_orders_share_token ON orders(share_token) WHERE share_token IS NOT NULL;

-- RLS note: The public share page reads via API route using service role client,
-- not direct client query. No additional RLS policy needed for anonymous access.
