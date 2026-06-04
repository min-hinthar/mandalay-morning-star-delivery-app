-- Migration: Extend route_status enum with assigned and accepted values
-- Phase 101: Driver Experience
-- CRITICAL: ALTER TYPE ADD VALUE cannot run inside a transaction that later
-- uses the new values. Each ADD VALUE must be its own statement, and the
-- new values are only usable AFTER this migration's transaction commits.
-- Backfill and RPC updates are in separate migration files.

ALTER TYPE route_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE route_status ADD VALUE IF NOT EXISTS 'accepted';
