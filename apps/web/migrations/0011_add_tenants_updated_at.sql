-- Add updated_at column to tenants table
-- SQLite doesn't allow CURRENT_TIMESTAMP in ALTER TABLE, so we use NULL and update existing rows
ALTER TABLE tenants ADD COLUMN updated_at DATETIME;
UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
