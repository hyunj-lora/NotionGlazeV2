-- Make notion_user_id optional since we now use Google/Social Auth as primary
-- SQLite doesn't directly support setting a column to NULL easily, but we can do it via a recreate or 
-- we can just add a new `provider` and `provider_id` columns to `users`.

ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'notion';
ALTER TABLE users ADD COLUMN provider_id TEXT;

-- For existing users, their notion_user_id acts as their provider_id
UPDATE users SET provider_id = notion_user_id;

-- Tenants now should have a connection_type to support 'public_link'
ALTER TABLE tenants ADD COLUMN connection_type TEXT DEFAULT 'oauth_db';
ALTER TABLE tenants ADD COLUMN public_link_url TEXT;

-- Create an index to look up users by provider and provider_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
