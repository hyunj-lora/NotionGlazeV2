-- Create tenant_sources table
CREATE TABLE IF NOT EXISTS tenant_sources (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    notion_db_id TEXT NOT NULL,
    name TEXT NOT NULL,
    auto_tag TEXT, -- Optional tag to apply to all posts from this source
    last_synced_at INT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Add source_id to posts to track which database the post belongs to
ALTER TABLE posts ADD COLUMN source_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenant_sources_tenant_id ON tenant_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_posts_source_id ON posts(source_id);
