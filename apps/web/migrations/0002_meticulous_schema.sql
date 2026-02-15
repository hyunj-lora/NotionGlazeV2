-- Add missing page-level fields to posts
ALTER TABLE posts ADD COLUMN icon TEXT;
ALTER TABLE posts ADD COLUMN created_time INT;
ALTER TABLE posts ADD COLUMN archived BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN in_trash BOOLEAN DEFAULT FALSE;

-- Create a dedicated blocks table for granular control
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  parent_id TEXT, -- For nested blocks (toggle, columns, etc)
  type TEXT NOT NULL,
  content_json TEXT, -- The specific content of this block
  created_time INT,
  last_edited_time INT,
  order_index INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_post_id ON blocks(post_id);
CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON blocks(parent_id);
