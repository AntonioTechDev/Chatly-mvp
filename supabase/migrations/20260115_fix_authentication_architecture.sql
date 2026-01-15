-- ============================================================================
-- CRITICAL FIX: Authentication & Onboarding Architecture
-- ============================================================================
-- Migration: 20260115_fix_authentication_architecture
-- Date: 2026-01-15
-- Description: Fixes root causes of authentication and onboarding failures
--
-- PROBLEMS ADDRESSED:
-- 1. Missing automatic profile creation trigger for new auth.users
-- 2. Orphaned auth.users without profiles table records
-- 3. Inconsistent relationship between profiles and platform_clients
-- 4. Missing RLS policies causing frontend access issues
-- 5. Data type mismatches in foreign key relationships
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Ensure profiles table exists with correct schema
-- ============================================================================

-- Create profiles table if it doesn't exist (idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key is UUID matching auth.users.id
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- User identification and contact
    username text UNIQUE,
    full_name text,
    phone_number text,
    phone_verified boolean DEFAULT false,

    -- Avatar and personal info
    avatar_url text,
    website text,

    -- Role in the organization
    role text,

    -- Link to platform_client (the business account)
    platform_client_id bigint REFERENCES public.platform_clients(id) ON DELETE SET NULL,

    -- First access flag for onboarding UX
    first_access boolean DEFAULT true,

    -- Timestamps
    updated_at timestamptz DEFAULT now()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- Check and add missing columns one by one
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'platform_client_id') THEN
        ALTER TABLE public.profiles ADD COLUMN platform_client_id bigint REFERENCES public.platform_clients(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'profiles'
                   AND column_name = 'first_access') THEN
        ALTER TABLE public.profiles ADD COLUMN first_access boolean DEFAULT true;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users - created automatically on signup';
COMMENT ON COLUMN public.profiles.id IS 'UUID matching auth.users.id';
COMMENT ON COLUMN public.profiles.platform_client_id IS 'Reference to the business account (platform_clients)';
COMMENT ON COLUMN public.profiles.first_access IS 'Flag to track if user needs onboarding wizard';
COMMENT ON COLUMN public.profiles.role IS 'User role in the organization (owner, admin, agent)';

-- ============================================================================
-- STEP 2: Fix platform_clients.user_id data type and constraints
-- ============================================================================

-- Check if user_id column exists and has correct type
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'platform_clients'
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.platform_clients
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    ELSE
        -- Check if it's text type and needs conversion
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'platform_clients'
                   AND column_name = 'user_id'
                   AND data_type = 'text') THEN

            -- Drop existing foreign key constraint if exists
            ALTER TABLE public.platform_clients
            DROP CONSTRAINT IF EXISTS platform_clients_user_id_fkey;

            -- Convert column type from text to uuid
            ALTER TABLE public.platform_clients
            ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

            -- Re-add foreign key constraint
            ALTER TABLE public.platform_clients
            ADD CONSTRAINT platform_clients_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Add unique constraint to ensure one platform_client per user_id
-- (A user can only own/manage one business account)
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_clients_user_id_unique
ON public.platform_clients(user_id)
WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.platform_clients.user_id IS 'Owner/creator of this platform_client (business account)';

-- ============================================================================
-- STEP 3: Create automatic profile creation trigger
-- ============================================================================

-- Drop existing function/trigger if they exist (for clean reinstall)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function that will handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert a new profile for the newly created auth.user
    INSERT INTO public.profiles (id, full_name, avatar_url, first_access, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        true,
        NOW()
    );

    RETURN NEW;
END;
$$;

-- Create the trigger that fires after a new user is inserted
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';

-- ============================================================================
-- STEP 4: Backfill missing profiles for existing users
-- ============================================================================

-- Create profiles for all auth.users that don't have one yet
INSERT INTO public.profiles (id, full_name, avatar_url, first_access, updated_at)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name') as full_name,
    au.raw_user_meta_data->>'avatar_url' as avatar_url,
    true as first_access,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Log the number of profiles created
DO $$
DECLARE
    profiles_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_created
    FROM auth.users au
    INNER JOIN public.profiles p ON au.id = p.id
    WHERE p.updated_at >= NOW() - INTERVAL '10 seconds';

    RAISE NOTICE 'Backfilled % profiles for existing users', profiles_created;
END $$;

-- ============================================================================
-- STEP 5: Fix relationship between profiles and platform_clients
-- ============================================================================

-- Update profiles.platform_client_id for users who already have a platform_client
UPDATE public.profiles p
SET platform_client_id = pc.id
FROM public.platform_clients pc
WHERE pc.user_id = p.id
  AND p.platform_client_id IS NULL;

-- Update platform_clients.user_id for records that have email match but no user_id
-- (This handles cases where platform_client was created before user registration)
UPDATE public.platform_clients pc
SET user_id = au.id
FROM auth.users au
WHERE pc.email = au.email
  AND pc.user_id IS NULL;

-- ============================================================================
-- STEP 6: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Allow service role to insert profiles (for trigger)
CREATE POLICY "Service role can insert profiles"
    ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Allow authenticated users to insert their own profile (backup)
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 7: Update RLS policies on platform_clients
-- ============================================================================

-- Enable RLS on platform_clients if not already enabled
ALTER TABLE public.platform_clients ENABLE ROW LEVEL SECURITY;

-- Drop and recreate platform_clients policies
DROP POLICY IF EXISTS "Users can view own platform_client" ON public.platform_clients;
DROP POLICY IF EXISTS "Users can update own platform_client" ON public.platform_clients;
DROP POLICY IF EXISTS "Users can insert own platform_client" ON public.platform_clients;

-- Policy: Users can view their own platform_client (owner)
CREATE POLICY "Users can view own platform_client"
    ON public.platform_clients
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR id IN (
            SELECT platform_client_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can update their own platform_client
CREATE POLICY "Users can update own platform_client"
    ON public.platform_clients
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can insert their own platform_client (onboarding)
CREATE POLICY "Users can insert own platform_client"
    ON public.platform_clients
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 8: Create indexes for performance
-- ============================================================================

-- Index on profiles.platform_client_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_platform_client_id
ON public.profiles(platform_client_id);

-- Index on platform_clients.user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_clients_user_id
ON public.platform_clients(user_id);

-- Index on platform_clients.email for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_clients_email
ON public.platform_clients(email);

-- Index on platform_clients onboarding fields for wizard queries
CREATE INDEX IF NOT EXISTS idx_platform_clients_onboarding
ON public.platform_clients(user_id, onboarding_step, onboarding_status)
WHERE user_id IS NOT NULL;

-- ============================================================================
-- STEP 9: Create helper function to get user onboarding state
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_onboarding_state(uuid);

CREATE OR REPLACE FUNCTION public.get_user_onboarding_state(user_uuid uuid)
RETURNS TABLE (
    has_profile boolean,
    has_platform_client boolean,
    onboarding_step integer,
    onboarding_status text,
    is_active boolean,
    platform_client_id bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (p.id IS NOT NULL) as has_profile,
        (pc.id IS NOT NULL) as has_platform_client,
        COALESCE(pc.onboarding_step, 1) as onboarding_step,
        COALESCE(pc.onboarding_status, 'started') as onboarding_status,
        COALESCE(pc.is_active, false) as is_active,
        pc.id as platform_client_id
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    LEFT JOIN public.platform_clients pc ON au.id = pc.user_id
    WHERE au.id = user_uuid;
END;
$$;

COMMENT ON FUNCTION public.get_user_onboarding_state(uuid) IS 'Returns complete onboarding state for a user';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_onboarding_state(uuid) TO authenticated;

-- ============================================================================
-- STEP 10: Create helper function to initialize platform_client
-- ============================================================================

DROP FUNCTION IF EXISTS public.initialize_platform_client(uuid, text, text);

CREATE OR REPLACE FUNCTION public.initialize_platform_client(
    user_uuid uuid,
    business_name_param text,
    email_param text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_client_id bigint;
BEGIN
    -- Check if platform_client already exists for this user
    SELECT id INTO new_client_id
    FROM public.platform_clients
    WHERE user_id = user_uuid;

    -- If not, create new platform_client
    IF new_client_id IS NULL THEN
        INSERT INTO public.platform_clients (
            user_id,
            business_name,
            email,
            onboarding_step,
            onboarding_status,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            user_uuid,
            business_name_param,
            email_param,
            1,
            'started',
            false,
            NOW(),
            NOW()
        )
        RETURNING id INTO new_client_id;

        -- Update profile to link to this platform_client
        UPDATE public.profiles
        SET platform_client_id = new_client_id,
            updated_at = NOW()
        WHERE id = user_uuid;
    END IF;

    RETURN new_client_id;
END;
$$;

COMMENT ON FUNCTION public.initialize_platform_client(uuid, text, text) IS 'Creates platform_client for user during onboarding';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.initialize_platform_client(uuid, text, text) TO authenticated;

-- ============================================================================
-- STEP 11: Create updated_at trigger for profiles
-- ============================================================================

-- Create generic update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to platform_clients table if not exists
DROP TRIGGER IF EXISTS update_platform_clients_updated_at ON public.platform_clients;

CREATE TRIGGER update_platform_clients_updated_at
    BEFORE UPDATE ON public.platform_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 12: Data validation and cleanup
-- ============================================================================

-- Set default onboarding_step for NULL values
UPDATE public.platform_clients
SET onboarding_step = 1
WHERE onboarding_step IS NULL;

-- Set default onboarding_status for NULL values
UPDATE public.platform_clients
SET onboarding_status = 'started'
WHERE onboarding_status IS NULL;

-- Set default is_active for NULL values
UPDATE public.platform_clients
SET is_active = false
WHERE is_active IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - run manually for validation)
-- ============================================================================

-- Uncomment to verify the migration:

-- SELECT COUNT(*) as total_users FROM auth.users;
-- SELECT COUNT(*) as total_profiles FROM public.profiles;
-- SELECT COUNT(*) as total_platform_clients FROM public.platform_clients;
--
-- SELECT COUNT(*) as users_without_profiles
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id
-- WHERE p.id IS NULL;
--
-- SELECT * FROM public.get_user_onboarding_state((SELECT id FROM auth.users LIMIT 1));

COMMIT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20260115_fix_authentication_architecture completed successfully';
    RAISE NOTICE 'Key changes:';
    RAISE NOTICE '  - Created/verified profiles table structure';
    RAISE NOTICE '  - Created automatic profile creation trigger (handle_new_user)';
    RAISE NOTICE '  - Backfilled profiles for existing auth.users';
    RAISE NOTICE '  - Fixed user_id data type and relationships';
    RAISE NOTICE '  - Configured RLS policies for secure access';
    RAISE NOTICE '  - Created helper functions for onboarding state management';
    RAISE NOTICE '  - Added performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Test authentication flow with new users';
    RAISE NOTICE '⚠️  IMPORTANT: Verify existing users can access their platform_clients';
END $$;
