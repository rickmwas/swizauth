-- Add plan and billing fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS billing_metadata JSONB;
