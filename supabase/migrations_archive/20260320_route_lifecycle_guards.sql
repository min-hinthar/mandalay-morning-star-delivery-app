-- Phase 105: Route Lifecycle Guards
-- 1. Re-backfill: convert any planned routes with driver_id to assigned
-- 2. Add CHECK constraint preventing planned + driver_id invalid state

-- Re-backfill orphaned routes (admin PATCH could create planned+driver_id after initial backfill)
UPDATE routes
SET status = 'assigned'
WHERE driver_id IS NOT NULL
  AND status = 'planned';

-- Prevent future invalid state: planned routes must not have a driver assigned
ALTER TABLE routes
ADD CONSTRAINT chk_planned_unassigned
  CHECK (status != 'planned' OR driver_id IS NULL);
