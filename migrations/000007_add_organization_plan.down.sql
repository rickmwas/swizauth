-- Rollback plan and billing fields from organizations
ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS billing_metadata,
  DROP COLUMN IF EXISTS plan_expires_at,
  DROP COLUMN IF EXISTS subscription_id,
  DROP COLUMN IF EXISTS plan;
