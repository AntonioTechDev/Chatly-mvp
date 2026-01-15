-- Migration: Add missing onboarding fields to platform_clients and profiles
-- Date: 2026-01-15
-- Description: Aligns schema with Frontend Wizard steps (3-7).

-- 1. Add Business Details to platform_clients
ALTER TABLE platform_clients
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS employee_count text,
ADD COLUMN IF NOT EXISTS customer_type text, -- 'b2b' or 'b2c'
ADD COLUMN IF NOT EXISTS acquisition_channels text[], -- Array of strings
ADD COLUMN IF NOT EXISTS usage_goals text[]; -- Array of strings

-- 2. Add Role to profiles (Assuming profiles table exists linked to auth.users)
-- First ensure profiles table exists (if not already)
-- (In a real scenario we assume it exists, but IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  platform_client_id bigint REFERENCES platform_clients(id),
  
  -- New field
  role text,
  phone_number text,
  phone_verified boolean DEFAULT false
);

-- If table existed but columns missing:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE profiles ADD COLUMN phone_number text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE profiles ADD COLUMN phone_verified boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'platform_client_id') THEN
        ALTER TABLE profiles ADD COLUMN platform_client_id bigint REFERENCES platform_clients(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_access') THEN
        ALTER TABLE profiles ADD COLUMN first_access boolean DEFAULT true;
    END IF;
END $$;

-- 3. Comments
COMMENT ON COLUMN platform_clients.customer_type IS 'b2b or b2c';
COMMENT ON COLUMN platform_clients.acquisition_channels IS 'List of channels used (WhatsApp, Instagram, etc)';
