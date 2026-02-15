-- Migration to add missing SEO and routing fields
ALTER TABLE posts ADD COLUMN seo_title TEXT;
ALTER TABLE posts ADD COLUMN seo_description TEXT;

ALTER TABLE tenants ADD COLUMN subdomain TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
