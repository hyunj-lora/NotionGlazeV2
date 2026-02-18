-- Add token validation tracking to tenants table
ALTER TABLE tenants ADD COLUMN last_token_check_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_tenants_last_token_check ON tenants(last_token_check_at);
