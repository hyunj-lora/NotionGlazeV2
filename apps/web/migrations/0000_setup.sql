-- Existing pain_points table for landing page
CREATE TABLE IF NOT EXISTS pain_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Core SaaS Tables
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY, -- Notion User ID
  root_page_id TEXT,
  notion_access_token TEXT,
  custom_domain TEXT UNIQUE,
  config_json TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, -- Block ID
  tenant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT,
  summary TEXT, -- Short excerpt
  tags TEXT, -- JSON array of tags
  content_json TEXT, -- Optimized JSON
  cover_image_url TEXT, -- R2 URL
  published_at INT, -- Custom publication date
  last_edited_time INT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_tenant_slug ON posts(tenant_id, slug);
