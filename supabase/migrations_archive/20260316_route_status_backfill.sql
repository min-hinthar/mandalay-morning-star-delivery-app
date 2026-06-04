-- Migration: Add accept/decline tracking columns and backfill assigned status
-- Phase 101: Driver Experience
-- Runs AFTER enum values are committed (separate migration file guarantees this)

-- Add accept/decline tracking columns
ALTER TABLE routes ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS declined_reason TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES drivers(id);

-- Backfill: routes with driver_id and planned status -> assigned
-- These are routes that were already assigned to drivers before the enum extension
UPDATE routes SET status = 'assigned'
WHERE driver_id IS NOT NULL AND status = 'planned';
