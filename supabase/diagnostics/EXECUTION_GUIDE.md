# Execution Guide: Database Audit & Fixes

## Quick Start

### Prerequisites
- Supabase CLI installed
- Access to project `dstzlwmumpbcmrncujft`
- PostgreSQL client (psql) or Supabase SQL Editor access

---

## Step 1: Run Diagnostic Audit

### Option A: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/dstzlwmumpbcmrncujft/sql
   ```

2. **Open the audit file**
   ```
   C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp\supabase\diagnostics\20260115_critical_audit.sql
   ```

3. **Copy and paste into SQL Editor**
   - Remove all `\echo` lines (not supported in web editor)
   - Run each section separately or all at once

4. **Save results**
   - Export as CSV or copy to text file
   - Save as `audit_results_[timestamp].txt`

### Option B: Using Supabase CLI

```bash
cd "C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp"

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref dstzlwmumpbcmrncujft

# Execute audit
supabase db execute -f supabase/diagnostics/20260115_critical_audit.sql > audit_results.txt
```

### Option C: Using psql Directly

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.dstzlwmumpbcmrncujft.supabase.co:5432/postgres" \
  -f supabase/diagnostics/20260115_critical_audit.sql \
  -o audit_results.txt
```

---

## Step 2: Review Audit Results

### Critical Findings to Check

1. **Section 1.1 - User Exists?**
   ```
   Expected: 1 row with email 'automagruppoitalia@gmail.com'
   ```

2. **Section 1.2 - Profile Exists?**
   ```
   Expected (ISSUE): 0 rows (profile missing)
   Desired: 1 row
   ```

3. **Section 1.3 - Platform Client Exists?**
   ```
   Check: Does platform_client exist for this email?
   Check: Is user_id populated and correct?
   ```

4. **Section 3.1 - Trigger Exists?**
   ```
   Expected (ISSUE): 0 rows (no trigger on auth.users)
   Desired: 1 row with trigger_name 'on_auth_user_created'
   ```

5. **Section 5.1 - Users Without Profiles**
   ```
   Expected (ISSUE): > 0 (orphaned users)
   Desired: 0
   ```

### Example Expected Output (BEFORE FIX)

```
=== 1.1 Check auth.users record ===
id                                   | email                          | created_at
------------------------------------ | ------------------------------ | -------------------------
abc-123-def-456                      | automagruppoitalia@gmail.com   | 2026-01-10 10:30:00+00

=== 1.2 Check if profile exists ===
(0 rows) ← PROBLEM: Profile missing!

=== 1.3 Check if platform_client exists ===
id  | email                          | business_name  | user_id     | onboarding_step
--- | ------------------------------ | -------------- | ----------- | ----------------
1   | automagruppoitalia@gmail.com   | AutoMa Gruppo  | NULL        | 1
    ← PROBLEM: user_id is NULL!

=== 3.1 List all triggers on auth.users ===
(0 rows) ← PROBLEM: No trigger!

=== 5.1 Count auth users without profiles ===
users_without_profiles
-----------------------
5 ← PROBLEM: 5 users have no profiles!
```

---

## Step 3: Apply Database Fixes

### IMPORTANT: Backup First!

```bash
# Create backup of current database state
supabase db dump -f backup_before_fix_$(date +%Y%m%d_%H%M%S).sql
```

### Option A: Using Supabase Migrations (Recommended)

```bash
cd "C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp"

# Check migration status
supabase migration list

# Apply the fix migration
supabase db push

# Verify migration applied
supabase migration list
```

This will apply:
```
C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp\supabase\migrations\20260115_fix_authentication_architecture.sql
```

### Option B: Using SQL Editor

1. **Open Supabase SQL Editor**
2. **Copy entire contents** of `20260115_fix_authentication_architecture.sql`
3. **Paste and execute**
4. **Watch for SUCCESS message** at end

### Option C: Using psql

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.dstzlwmumpbcmrncujft.supabase.co:5432/postgres" \
  -f supabase/migrations/20260115_fix_authentication_architecture.sql
```

---

## Step 4: Verify Fixes Applied

### Run Verification Queries

```sql
-- 1. Check trigger now exists
SELECT COUNT(*) as trigger_exists
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';
-- Expected: 1

-- 2. Check no orphaned users
SELECT COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
-- Expected: 0

-- 3. Check specific user now has profile
SELECT
    au.email,
    p.id as profile_id,
    p.full_name,
    pc.id as platform_client_id,
    pc.onboarding_step
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.platform_clients pc ON au.id = pc.user_id
WHERE au.email = 'automagruppoitalia@gmail.com';
-- Expected: profile_id NOT NULL, platform_client_id NOT NULL

-- 4. Test helper function
SELECT * FROM public.get_user_onboarding_state(
    (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com')
);
-- Expected: has_profile = true, has_platform_client = true
```

### Expected Output (AFTER FIX)

```
trigger_exists
--------------
1 ✅

users_without_profiles
----------------------
0 ✅

email                          | profile_id  | full_name     | platform_client_id | onboarding_step
------------------------------ | ----------- | ------------- | ------------------ | ----------------
automagruppoitalia@gmail.com   | abc-123-def | AutoMa Gruppo | 1                  | 1
✅ All fields populated!

has_profile | has_platform_client | onboarding_step | onboarding_status
----------- | -------------------- | --------------- | ------------------
true        | true                 | 1               | started
✅ Function returns correct state!
```

---

## Step 5: Test Authentication Flows

### Test 1: New Email Registration

```bash
# Using Supabase Dashboard → Authentication → Users → Add User
# Or test via your frontend
```

1. Register new user: `test@example.com` / password
2. Confirm email
3. Login
4. **Verify**: Profile auto-created
   ```sql
   SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   ```
5. Complete Step 1 of wizard
6. **Verify**: Platform client created and linked
   ```sql
   SELECT * FROM platform_clients WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   ```
7. Reload page
8. **Verify**: User stays at Step 2 (not reset to Step 1)

### Test 2: Google OAuth

1. Sign in with Google
2. **Verify**: Profile auto-created with Google data
   ```sql
   SELECT
       p.id,
       p.full_name,  -- Should be populated from Google
       p.avatar_url, -- Should be Google avatar
       au.raw_user_meta_data
   FROM profiles p
   JOIN auth.users au ON p.id = au.id
   WHERE au.email = '[GOOGLE-EMAIL]';
   ```
3. Complete Step 1
4. **Verify**: No infinite loop, advances to Step 2

### Test 3: Existing User Login

1. Login as `automagruppoitalia@gmail.com`
2. **Verify**: Profile loads correctly
3. **Verify**: Onboarding state preserved
4. **Verify**: Can continue wizard from current step

---

## Step 6: Monitor for Issues

### Set Up Monitoring Query

```sql
-- Run this daily to check for orphaned records
SELECT
    'Orphaned Users' as issue,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT
    'Orphaned Platform Clients' as issue,
    COUNT(*) as count
FROM public.platform_clients pc
LEFT JOIN public.profiles p ON pc.user_id = p.id
WHERE pc.user_id IS NOT NULL AND p.id IS NULL;

-- Expected: All counts = 0
```

### Check Recent Signups

```sql
-- Check last 10 users have profiles
SELECT
    au.email,
    au.created_at,
    CASE WHEN p.id IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;
```

---

## Rollback Plan (If Needed)

### If Something Goes Wrong

1. **Stop application** (prevent new users from signing up)

2. **Restore from backup**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.dstzlwmumpbcmrncujft.supabase.co:5432/postgres" \
     < backup_before_fix_YYYYMMDD_HHMMSS.sql
   ```

3. **Contact Supabase Support**
   - Explain the issue
   - Provide audit results and error logs

### Manual Rollback (Partial)

```sql
-- Remove trigger (if causing issues)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: Do NOT delete profiles that were created
-- Users will lose access if you delete profiles
```

---

## Troubleshooting

### Issue: Trigger Not Firing

**Symptoms**: New users still don't get profiles

**Check**:
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Fix**:
```sql
-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Issue: RLS Blocking Access

**Symptoms**: Frontend queries return empty even though data exists

**Check**:
```sql
-- Disable RLS temporarily to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Try query
-- Re-enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Fix**:
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Recreate if missing (see migration file)
```

### Issue: Data Type Mismatch in JOINs

**Symptoms**: `profiles.platform_clients` returns NULL even though platform_client exists

**Check**:
```sql
SELECT
    data_type
FROM information_schema.columns
WHERE table_name = 'platform_clients'
  AND column_name = 'user_id';
-- Should return: uuid
```

**Fix**:
```sql
ALTER TABLE platform_clients
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
```

---

## Success Checklist

After completing all steps, verify:

- [ ] Audit completed and results saved
- [ ] Migration applied successfully
- [ ] Trigger `on_auth_user_created` exists
- [ ] Function `handle_new_user()` exists
- [ ] 0 users without profiles
- [ ] `platform_clients.user_id` is type `uuid`
- [ ] RLS policies active on `profiles` and `platform_clients`
- [ ] Helper function `get_user_onboarding_state()` works
- [ ] Test user registration creates profile automatically
- [ ] Test Google OAuth creates profile automatically
- [ ] Existing user `automagruppoitalia@gmail.com` can login and continue onboarding
- [ ] No infinite loops in wizard

---

## Next Steps After Fix

1. **Update Frontend Types**
   - Regenerate TypeScript types: `supabase gen types typescript --local > frontend/src/core/types/database.types.ts`

2. **Update Frontend Queries**
   - Modify `AuthContext.tsx` to join `platform_clients`
   - Update `useAuthWizard.ts` to use `platform_clients.onboarding_step`

3. **Add Error Handling**
   - Handle case where profile/platform_client is NULL (shouldn't happen, but defensive)

4. **Monitor Production**
   - Check daily for orphaned records
   - Track signup success rate
   - Monitor Supabase logs for errors

---

## Support Contacts

- **Database Issues**: Check Supabase Dashboard → Logs → Postgres Logs
- **Auth Issues**: Check Supabase Dashboard → Logs → Auth Logs
- **Supabase Support**: https://supabase.com/dashboard/support

---

**File Locations**:
- Audit SQL: `C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp\supabase\diagnostics\20260115_critical_audit.sql`
- Fix Migration: `C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp\supabase\migrations\20260115_fix_authentication_architecture.sql`
- Root Cause Analysis: `C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp\supabase\diagnostics\ROOT_CAUSE_ANALYSIS.md`
