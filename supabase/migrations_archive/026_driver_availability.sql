-- Migration: Add driver availability JSONB column
-- Phase 73: Driver Availability & Route Visibility

ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS availability_json JSONB
DEFAULT '{"available_days": [], "blocked_dates": []}'::jsonb;

COMMENT ON COLUMN drivers.availability_json IS
'Driver weekly availability: available_days (recurring day-of-week) and blocked_dates (one-off YYYY-MM-DD)';
