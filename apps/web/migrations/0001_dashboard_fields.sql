-- Migration to add status and notion_url to posts
ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'Published';
ALTER TABLE posts ADD COLUMN notion_url TEXT;
