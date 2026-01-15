-- ============================================================================
-- CRITICAL DATABASE AUDIT - Chatly MVP Authentication & Onboarding System
-- ============================================================================
-- Project: dstzlwmumpbcmrncujft
-- Date: 2026-01-15
-- Purpose: Comprehensive audit to identify root causes of auth/onboarding failures
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER STATE AUDIT
-- ============================================================================
-- Check the complete state of the problematic user: automagruppoitalia@gmail.com

\echo '=== 1.1 Check auth.users record ==='
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'automagruppoitalia@gmail.com';

\echo ''
\echo '=== 1.2 Check if profile exists ==='
SELECT
    p.*
FROM public.profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');

\echo ''
\echo '=== 1.3 Check if platform_client exists ==='
SELECT
    id,
    email,
    business_name,
    user_id,
    onboarding_step,
    onboarding_status,
    onboarding_completed_at,
    is_active,
    created_at,
    updated_at
FROM public.platform_clients
WHERE email = 'automagruppoitalia@gmail.com';

\echo ''
\echo '=== 1.4 Check platform_client by user_id (if user exists) ==='
SELECT
    pc.id,
    pc.email,
    pc.business_name,
    pc.user_id,
    pc.onboarding_step,
    pc.onboarding_status,
    pc.is_active
FROM public.platform_clients pc
WHERE pc.user_id = (SELECT id::text FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');

-- ============================================================================
-- SECTION 2: SCHEMA ANALYSIS
-- ============================================================================
-- Verify table structures and identify schema discrepancies

\echo ''
\echo '=== 2.1 Profiles table schema ==='
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

\echo ''
\echo '=== 2.2 Platform_clients table schema ==='
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'platform_clients'
ORDER BY ordinal_position;

\echo ''
\echo '=== 2.3 Check if profiles table exists ==='
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
) as profiles_table_exists;

-- ============================================================================
-- SECTION 3: TRIGGER INVESTIGATION
-- ============================================================================
-- Check for automatic profile creation triggers

\echo ''
\echo '=== 3.1 List all triggers on auth.users ==='
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

\echo ''
\echo '=== 3.2 List all functions related to profile creation ==='
SELECT
    routine_schema,
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%profile%'
    OR routine_name LIKE '%user%'
    OR routine_name LIKE '%auth%'
  )
ORDER BY routine_name;

\echo ''
\echo '=== 3.3 Get function definitions for profile-related functions ==='
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%profile%'
    OR p.proname LIKE '%handle_new_user%'
    OR p.proname LIKE '%create_user%'
  )
ORDER BY p.proname;

\echo ''
\echo '=== 3.4 List all triggers on profiles table ==='
SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profiles'
ORDER BY trigger_name;

-- ============================================================================
-- SECTION 4: CONSTRAINT ANALYSIS
-- ============================================================================
-- Verify foreign key relationships and constraints

\echo ''
\echo '=== 4.1 Check all constraints on profiles table ==='
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
ORDER BY tc.constraint_type, tc.constraint_name;

\echo ''
\echo '=== 4.2 Check foreign key relationships on profiles ==='
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

\echo ''
\echo '=== 4.3 Check foreign key relationships on platform_clients ==='
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'platform_clients'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;

-- ============================================================================
-- SECTION 5: DATA INTEGRITY ANALYSIS
-- ============================================================================
-- Verify data integrity issues and orphaned records

\echo ''
\echo '=== 5.1 Count auth users without profiles (should be 0) ==='
SELECT COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id::text = p.id
WHERE p.id IS NULL;

\echo ''
\echo '=== 5.2 List first 10 auth users without profiles ==='
SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id::text = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

\echo ''
\echo '=== 5.3 Count profiles without platform_clients ==='
SELECT COUNT(*) as profiles_without_clients
FROM public.profiles p
LEFT JOIN public.platform_clients pc ON p.id::text = pc.user_id
WHERE pc.id IS NULL;

\echo ''
\echo '=== 5.4 List profiles without platform_clients ==='
SELECT
    p.id,
    p.full_name,
    p.username,
    p.role,
    p.first_access,
    p.platform_client_id,
    p.updated_at
FROM public.profiles p
LEFT JOIN public.platform_clients pc ON p.id::text = pc.user_id
WHERE pc.id IS NULL
ORDER BY p.updated_at DESC
LIMIT 10;

\echo ''
\echo '=== 5.5 Count platform_clients without profiles ==='
SELECT COUNT(*) as clients_without_profiles
FROM public.platform_clients pc
LEFT JOIN public.profiles p ON pc.user_id = p.id
WHERE p.id IS NULL
  AND pc.user_id IS NOT NULL;

\echo ''
\echo '=== 5.6 List platform_clients without profiles ==='
SELECT
    pc.id,
    pc.email,
    pc.business_name,
    pc.user_id,
    pc.onboarding_step,
    pc.onboarding_status,
    pc.created_at
FROM public.platform_clients pc
LEFT JOIN public.profiles p ON pc.user_id = p.id
WHERE p.id IS NULL
  AND pc.user_id IS NOT NULL
ORDER BY pc.created_at DESC
LIMIT 10;

\echo ''
\echo '=== 5.7 Count mismatched profile.platform_client_id relationships ==='
-- Check if profiles.platform_client_id matches the actual platform_clients.id
SELECT COUNT(*) as mismatched_relationships
FROM public.profiles p
LEFT JOIN public.platform_clients pc ON p.platform_client_id = pc.id
WHERE p.platform_client_id IS NOT NULL
  AND pc.id IS NULL;

\echo ''
\echo '=== 5.8 Count platform_clients with user_id but no auth.users record ==='
SELECT COUNT(*) as clients_with_invalid_user_id
FROM public.platform_clients pc
LEFT JOIN auth.users au ON pc.user_id = au.id::text
WHERE pc.user_id IS NOT NULL
  AND au.id IS NULL;

-- ============================================================================
-- SECTION 6: RLS POLICIES ANALYSIS
-- ============================================================================
-- Check Row Level Security policies

\echo ''
\echo '=== 6.1 Check if RLS is enabled on profiles ==='
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'platform_clients')
ORDER BY tablename;

\echo ''
\echo '=== 6.2 List all RLS policies on profiles ==='
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

\echo ''
\echo '=== 6.3 List all RLS policies on platform_clients ==='
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'platform_clients'
ORDER BY policyname;

-- ============================================================================
-- SECTION 7: ONBOARDING STEP TRACKING ANALYSIS
-- ============================================================================
-- Analyze onboarding step tracking

\echo ''
\echo '=== 7.1 Distribution of onboarding steps ==='
SELECT
    onboarding_step,
    onboarding_status,
    COUNT(*) as count
FROM public.platform_clients
GROUP BY onboarding_step, onboarding_status
ORDER BY onboarding_step;

\echo ''
\echo '=== 7.2 Users stuck at Step 1 ==='
SELECT
    pc.id,
    pc.email,
    pc.business_name,
    pc.user_id,
    pc.onboarding_step,
    pc.onboarding_status,
    pc.is_active,
    pc.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM public.platform_clients pc
LEFT JOIN auth.users au ON pc.user_id = au.id::text
LEFT JOIN public.profiles p ON pc.user_id = p.id
WHERE pc.onboarding_step = 1
   OR pc.onboarding_step IS NULL
ORDER BY pc.created_at DESC;

\echo ''
\echo '=== 7.3 Check for NULL or invalid onboarding_step values ==='
SELECT
    COUNT(*) FILTER (WHERE onboarding_step IS NULL) as null_steps,
    COUNT(*) FILTER (WHERE onboarding_step < 1) as invalid_steps,
    COUNT(*) FILTER (WHERE onboarding_step > 7) as excessive_steps,
    COUNT(*) FILTER (WHERE onboarding_step BETWEEN 1 AND 7) as valid_steps
FROM public.platform_clients;

-- ============================================================================
-- SECTION 8: AUTHENTICATION METHOD ANALYSIS
-- ============================================================================
-- Analyze different authentication methods (email vs OAuth)

\echo ''
\echo '=== 8.1 Count users by authentication provider ==='
SELECT
    raw_app_meta_data->>'provider' as auth_provider,
    COUNT(*) as user_count
FROM auth.users
GROUP BY auth_app_meta_data->>'provider'
ORDER BY user_count DESC;

\echo ''
\echo '=== 8.2 Compare profile creation for email vs OAuth users ==='
SELECT
    au.raw_app_meta_data->>'provider' as auth_provider,
    COUNT(au.id) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(au.id) - COUNT(p.id) as users_without_profiles,
    ROUND(100.0 * COUNT(p.id) / NULLIF(COUNT(au.id), 0), 2) as profile_creation_rate
FROM auth.users au
LEFT JOIN public.profiles p ON au.id::text = p.id
GROUP BY au.raw_app_meta_data->>'provider'
ORDER BY total_users DESC;

-- ============================================================================
-- SECTION 9: RECENT USER ACTIVITY
-- ============================================================================
-- Check recent user creation and activity

\echo ''
\echo '=== 9.1 Last 20 users created ==='
SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.raw_app_meta_data->>'provider' as provider,
    CASE WHEN p.id IS NULL THEN 'NO' ELSE 'YES' END as has_profile,
    CASE WHEN pc.id IS NULL THEN 'NO' ELSE 'YES' END as has_platform_client,
    pc.onboarding_step
FROM auth.users au
LEFT JOIN public.profiles p ON au.id::text = p.id
LEFT JOIN public.platform_clients pc ON au.id::text = pc.user_id
ORDER BY au.created_at DESC
LIMIT 20;

\echo ''
\echo '=== 9.2 Users created in last 7 days without profiles ==='
SELECT
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at,
    au.raw_app_meta_data->>'provider' as provider
FROM auth.users au
LEFT JOIN public.profiles p ON au.id::text = p.id
WHERE au.created_at > NOW() - INTERVAL '7 days'
  AND p.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================================================
-- SECTION 10: SUMMARY STATISTICS
-- ============================================================================
-- Overall system health check

\echo ''
\echo '=== 10.1 Overall data integrity summary ==='
SELECT
    'Total auth.users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
    'Total profiles' as metric,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT
    'Total platform_clients' as metric,
    COUNT(*) as count
FROM public.platform_clients
UNION ALL
SELECT
    'Users without profiles' as metric,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id::text = p.id
WHERE p.id IS NULL
UNION ALL
SELECT
    'Profiles without platform_clients' as metric,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN public.platform_clients pc ON p.id::text = pc.user_id
WHERE pc.id IS NULL
UNION ALL
SELECT
    'Platform_clients without profiles' as metric,
    COUNT(*) as count
FROM public.platform_clients pc
LEFT JOIN public.profiles p ON pc.user_id = p.id
WHERE p.id IS NULL
  AND pc.user_id IS NOT NULL;

\echo ''
\echo '=== AUDIT COMPLETE ==='
\echo ''
