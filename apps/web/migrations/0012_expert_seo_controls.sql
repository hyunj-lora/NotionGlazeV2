-- Migration: 0012_expert_seo_controls.sql
ALTER TABLE posts ADD COLUMN canonical_url TEXT;
ALTER TABLE posts ADD COLUMN noindex BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN ai_seo_status TEXT DEFAULT 'pending';
ALTER TABLE posts ADD COLUMN ai_seo_advice TEXT;
