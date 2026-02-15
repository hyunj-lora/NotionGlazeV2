-- Migration to add enriched sync feedback fields to tenants
ALTER TABLE tenants ADD COLUMN sync_status TEXT DEFAULT 'idle';
ALTER TABLE tenants ADD COLUMN last_synced_at INT;
ALTER TABLE tenants ADD COLUMN last_sync_error TEXT;
ALTER TABLE tenants ADD COLUMN last_sync_count INTEGER DEFAULT 0;
