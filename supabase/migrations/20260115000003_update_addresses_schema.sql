-- Update addresses schema to support V1 address management
-- Adds second address line, formatted address, postal code rename, and timestamps

ALTER TABLE addresses
  RENAME COLUMN street_address TO line_1;

ALTER TABLE addresses
  RENAME COLUMN zip_code TO postal_code;

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS line_2 TEXT;

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS formatted_address TEXT;

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill formatted_address and updated_at for existing rows
UPDATE addresses
SET
  formatted_address = COALESCE(
    formatted_address,
    CONCAT(line_1, ', ', city, ', ', state, ' ', postal_code)
  ),
  updated_at = COALESCE(updated_at, created_at);
