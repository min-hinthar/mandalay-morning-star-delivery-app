-- Phase 83: Driver Simplification
-- Add simple_mode column to drivers table for non-technical driver UI
ALTER TABLE drivers ADD COLUMN simple_mode boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN drivers.simple_mode IS 'Simple mode UI for non-technical drivers. Default true for new drivers.';
