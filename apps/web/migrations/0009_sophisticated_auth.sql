-- Add owner_id to tenants and create internal users/sessions tables

-- 1. Create users table (linked to Notion User ID)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Internal UUID
    notion_user_id TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, -- Opaque session token (UUID)
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Add owner_id to tenants
ALTER TABLE tenants ADD COLUMN owner_id TEXT REFERENCES users(id);

-- 4. Initial Migration logic: Link existing tenants to potential users
-- This will be handled in code during the first login of an old user,
-- but we can pre-populate if we want. For now, we'll let the code handle the link.

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
