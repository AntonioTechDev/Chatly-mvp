-- Migration: Update platform_clients schema for onboarding flow
-- Description: Adds business details columns to platform_clients to store onboarding data correctly.

-- 1. Add new columns to platform_clients
ALTER TABLE platform_clients
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS employee_count TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS usage_goals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS acquisition_channels JSONB DEFAULT '[]'::jsonb;

-- 2. Add comment for documentation
COMMENT ON COLUMN platform_clients.industry IS 'Business industry (e.g., Retail, Tech)';
COMMENT ON COLUMN platform_clients.employee_count IS 'Number of employees range';
COMMENT ON COLUMN platform_clients.website IS 'Business website URL';
COMMENT ON COLUMN platform_clients.onboarding_step IS 'Current step in the onboarding wizard';
COMMENT ON COLUMN platform_clients.usage_goals IS 'Array of goals selected during onboarding';
COMMENT ON COLUMN platform_clients.acquisition_channels IS 'How the client found the platform';

-- 3. Create index for analytics on industry
CREATE INDEX IF NOT EXISTS idx_platform_clients_industry ON platform_clients(industry);
