-- Migration to support native page analytics
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY, -- UUID
  tenant_id TEXT NOT NULL,
  post_id TEXT, -- Can be NULL for home/index page
  viewer_hash TEXT NOT NULL, -- Anonymized hash for unique visitor counting
  path TEXT NOT NULL,
  referrer TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE INDEX IF NOT EXISTS idx_page_views_tenant_time ON page_views(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
