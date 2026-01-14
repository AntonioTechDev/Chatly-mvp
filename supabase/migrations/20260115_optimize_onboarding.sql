-- Migration: Optimize platform_clients for Onboarding Flow
-- Date: 2026-01-15
-- Description: Adds fields to track onboarding progress and activation status.

-- 1. Add onboarding tracking columns
ALTER TABLE platform_clients
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'started',
ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;

-- 2. Add validation check for onboarding_status
ALTER TABLE platform_clients
ADD CONSTRAINT check_onboarding_status 
CHECK (onboarding_status IN ('started', 'whatsapp_connected', 'plan_selected', 'completed'));

-- 3. Comments for documentation
COMMENT ON COLUMN platform_clients.onboarding_status IS 'Current status of the onboarding process (started, whatsapp_connected, plan_selected, completed)';
COMMENT ON COLUMN platform_clients.onboarding_step IS 'Numeric step indicator for the frontend wizard';
COMMENT ON COLUMN platform_clients.is_active IS 'Global flag to enable/disable the tenant';
