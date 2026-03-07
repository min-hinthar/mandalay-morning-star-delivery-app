-- Phase 83 fix: Change simple_mode default to false
-- Previously DEFAULT true caused all drivers to see only Home + Route tabs.
-- New drivers should onboard with full access; simple mode is opt-in.
ALTER TABLE drivers ALTER COLUMN simple_mode SET DEFAULT false;

-- Reset all existing drivers to simple_mode = false so full nav is visible.
-- Drivers who prefer simple mode can re-enable it via the toggle on their profile page.
UPDATE drivers SET simple_mode = false WHERE simple_mode = true;

COMMENT ON COLUMN drivers.simple_mode IS 'Simple mode UI for non-technical drivers. Default false; drivers opt in via profile page toggle.';
