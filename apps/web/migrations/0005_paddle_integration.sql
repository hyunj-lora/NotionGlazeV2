-- Paddle Billing Integration Fields
ALTER TABLE tenants ADD COLUMN plan TEXT DEFAULT 'free'; -- 'free', 'pro'
ALTER TABLE tenants ADD COLUMN paddle_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN paddle_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN subscription_status TEXT; -- 'active', 'trialing', 'past_due', 'paused', 'deleted'
ALTER TABLE tenants ADD COLUMN subscription_ends_at INT;
