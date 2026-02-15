-- Migration to add trial_ends_at to tenants
ALTER TABLE tenants ADD COLUMN trial_ends_at INT;
