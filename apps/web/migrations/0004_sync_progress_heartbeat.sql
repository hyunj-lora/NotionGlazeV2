-- Migration to add sync progress and heartbeat for real-time feedback
ALTER TABLE tenants ADD COLUMN sync_progress INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN sync_heartbeat INTEGER;
