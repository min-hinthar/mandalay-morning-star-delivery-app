-- Migration: Add assigned_driver_id to orders table
-- Purpose: Enable driver assignment to orders for delivery

-- Add assigned_driver_id column to orders
ALTER TABLE orders
ADD COLUMN assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- Create index for efficient driver lookups
CREATE INDEX idx_orders_assigned_driver ON orders(assigned_driver_id) WHERE assigned_driver_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.assigned_driver_id IS 'The driver assigned to deliver this order';
