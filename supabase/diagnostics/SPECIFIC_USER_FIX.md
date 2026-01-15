# Specific User Fix: automagruppoitalia@gmail.com

**User Email**: automagruppoitalia@gmail.com
**Issue**: User stuck at Step 1 of onboarding wizard
**Root Cause**: Missing profile record in database

---

## Quick Diagnosis

Run this single query to check the user's current state:

```sql
SELECT
    'AUTH USERS' as source,
    au.id::text as id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    'N/A' as additional_info
FROM auth.users au
WHERE au.email = 'automagruppoitalia@gmail.com'

UNION ALL

SELECT
    'PROFILES' as source,
    p.id::text as id,
    p.full_name as email,
    p.updated_at as created_at,
    NULL as email_confirmed_at,
    CONCAT('platform_client_id: ', COALESCE(p.platform_client_id::text, 'NULL')) as additional_info
FROM public.profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com')

UNION ALL

SELECT
    'PLATFORM CLIENTS' as source,
    pc.id::text as id,
    pc.business_name as email,
    pc.created_at,
    NULL as email_confirmed_at,
    CONCAT('user_id: ', COALESCE(pc.user_id::text, 'NULL'), ', step: ', COALESCE(pc.onboarding_step::text, 'NULL')) as additional_info
FROM public.platform_clients pc
WHERE pc.email = 'automagruppoitalia@gmail.com';
```

---

## Expected Results

### If User is BROKEN (likely current state):

```
source            | id      | email/name           | created_at          | additional_info
----------------- | ------- | -------------------- | ------------------- | ---------------------------
AUTH USERS        | abc-123 | automagruppoitalia@  | 2026-01-10 10:00:00 | N/A
                  |         | gmail.com            |                     |
PROFILES          | (empty - NO ROWS)                                  | ← PROBLEM: Missing!
PLATFORM CLIENTS  | 1       | AutoMa Gruppo        | 2026-01-10 10:05:00 | user_id: NULL, step: 1
```

**Diagnosis**: User exists in auth.users, has a platform_clients record, but NO profile. The `user_id` is also NULL.

---

### After Fix is Applied:

```
source            | id      | email/name           | created_at          | additional_info
----------------- | ------- | -------------------- | ------------------- | ---------------------------
AUTH USERS        | abc-123 | automagruppoitalia@  | 2026-01-10 10:00:00 | N/A
                  |         | gmail.com            |                     |
PROFILES          | abc-123 | AutoMa Gruppo        | 2026-01-15 14:30:00 | platform_client_id: 1
PLATFORM CLIENTS  | 1       | AutoMa Gruppo        | 2026-01-10 10:05:00 | user_id: abc-123, step: 1
```

**Diagnosis**: All three records exist and are properly linked. User can now proceed with onboarding.

---

## Manual Fix (If Migration Cannot Be Run Immediately)

If you need to fix this specific user urgently before running the full migration:

```sql
-- Step 1: Get the user's UUID
DO $$
DECLARE
    user_uuid uuid;
    client_id bigint;
BEGIN
    -- Get user UUID
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'automagruppoitalia@gmail.com';

    RAISE NOTICE 'User UUID: %', user_uuid;

    -- Step 2: Create profile if missing
    INSERT INTO public.profiles (id, full_name, first_access, updated_at)
    VALUES (
        user_uuid,
        'AutoMa Gruppo', -- Or use actual user name
        true,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Profile created/verified';

    -- Step 3: Get platform_client ID
    SELECT id INTO client_id
    FROM public.platform_clients
    WHERE email = 'automagruppoitalia@gmail.com';

    RAISE NOTICE 'Platform Client ID: %', client_id;

    -- Step 4: Link user_id in platform_clients
    UPDATE public.platform_clients
    SET user_id = user_uuid
    WHERE email = 'automagruppoitalia@gmail.com';

    RAISE NOTICE 'Platform client user_id updated';

    -- Step 5: Link platform_client_id in profiles
    UPDATE public.profiles
    SET platform_client_id = client_id
    WHERE id = user_uuid;

    RAISE NOTICE 'Profile platform_client_id updated';

    -- Step 6: Verify fix
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'Profile exists: %',
        (SELECT COUNT(*) > 0 FROM profiles WHERE id = user_uuid);
    RAISE NOTICE 'Platform client linked: %',
        (SELECT user_id IS NOT NULL FROM platform_clients WHERE email = 'automagruppoitalia@gmail.com');
END $$;
```

---

## Verify Fix Worked

After manual fix or migration, run:

```sql
SELECT * FROM public.get_user_onboarding_state(
    (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com')
);
```

**Expected Output**:
```
has_profile | has_platform_client | onboarding_step | onboarding_status | is_active | platform_client_id
----------- | ------------------- | --------------- | ----------------- | --------- | ------------------
true        | true                | 1               | started           | false     | 1
```

All values should be populated (not NULL).

---

## Test User Can Login

1. **User logs in** at frontend
2. **Frontend queries profile**:
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('*, platform_clients(*)')
     .eq('id', user.id)
     .single();
   ```
3. **Expected**: `profile` object returned with `platform_clients` nested object
4. **Wizard should**:
   - Read `profile.platform_clients.onboarding_step` (should be 1)
   - Display Step 1 OR allow progression to Step 2 if Step 1 already completed
5. **User completes step**
6. **Backend updates** `platform_clients.onboarding_step = 2`
7. **Page reload**
8. **Expected**: Wizard shows Step 2 (NOT reset to Step 1)

---

## If User Still Has Issues After Fix

### Check 1: Profile Query Returns Data

```sql
SELECT
    p.id,
    p.full_name,
    p.platform_client_id,
    pc.id as pc_id,
    pc.business_name,
    pc.onboarding_step
FROM profiles p
LEFT JOIN platform_clients pc ON p.platform_client_id = pc.id
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');
```

Should return 1 row with all fields populated.

### Check 2: RLS Policies Allow Access

```sql
-- Test as the actual user
SET request.jwt.claim.sub = (SELECT id::text FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');

-- Try to select profile
SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');

-- Try to select platform_client
SELECT * FROM platform_clients WHERE user_id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');

-- Reset
RESET request.jwt.claim.sub;
```

Both queries should return data (not empty).

### Check 3: Data Types Match

```sql
SELECT
    'auth.users.id' as field,
    pg_typeof(id) as type
FROM auth.users
WHERE email = 'automagruppoitalia@gmail.com'

UNION ALL

SELECT
    'profiles.id' as field,
    pg_typeof(id) as type
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com')

UNION ALL

SELECT
    'platform_clients.user_id' as field,
    pg_typeof(user_id) as type
FROM platform_clients
WHERE email = 'automagruppoitalia@gmail.com';
```

**Expected**:
```
field                       | type
--------------------------- | ----
auth.users.id               | uuid
profiles.id                 | uuid
platform_clients.user_id    | uuid
```

All should be `uuid` (NOT `text`).

---

## Frontend Changes for This User

Once database is fixed, update frontend profile query:

**File**: `frontend/src/core/contexts/AuthContext.tsx`

```typescript
// OLD (broken)
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// NEW (fixed)
const { data: profile, error } = await supabase
  .from('profiles')
  .select(`
    *,
    platform_clients (
      id,
      business_name,
      email,
      onboarding_step,
      onboarding_status,
      is_active,
      website,
      industry,
      employee_count,
      customer_type,
      acquisition_channels,
      usage_goals
    )
  `)
  .eq('id', user.id)
  .single();

// Access onboarding state
const onboardingStep = profile?.platform_clients?.onboarding_step ?? 1;
const isOnboardingComplete = profile?.platform_clients?.onboarding_status === 'completed';
```

---

## Communication to User

**If user contacts support**:

> Hi there,
>
> We've identified the issue with your account. Due to a database configuration issue, your profile wasn't properly created during signup. We've now fixed this issue both for your account and for all future signups.
>
> Please try logging in again. You should now be able to:
> - Access the onboarding wizard
> - Continue from where you left off (Step 1 if not completed, or subsequent steps)
> - Complete the full onboarding process
>
> If you encounter any issues, please let us know immediately.
>
> Thank you for your patience!

---

## Timeline

1. **Issue Reported**: User stuck at Step 1, infinite loop
2. **Root Cause Identified**: Missing profile record, no auto-creation trigger
3. **Fix Prepared**: Complete database migration ready
4. **Deployment**: Apply fix migration (30 minutes)
5. **Verification**: Test specific user can now login and progress (15 minutes)
6. **Monitoring**: Check for any new issues (ongoing)

---

## Contact Info

If user continues to have issues after fix:

1. **Check Supabase Auth Logs**:
   - Dashboard → Logs → Auth Logs
   - Filter by user email

2. **Check Supabase Postgres Logs**:
   - Dashboard → Logs → Postgres Logs
   - Look for errors related to profiles table

3. **Check Frontend Console**:
   - Ask user to open browser DevTools
   - Look for Supabase query errors
   - Check Network tab for failed API calls

4. **Run Specific Diagnostic**:
   ```sql
   SELECT * FROM public.get_user_onboarding_state(
       (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com')
   );
   ```

---

## Success Criteria

User issue is resolved when:

- [ ] `auth.users` record exists ✅
- [ ] `profiles` record exists with matching UUID ✅
- [ ] `platform_clients` record exists with user_id linked ✅
- [ ] User can login without errors ✅
- [ ] Profile query returns data (not NULL) ✅
- [ ] Onboarding wizard loads correct step ✅
- [ ] User can progress to next steps ✅
- [ ] Page reload doesn't reset to Step 1 ✅

---

**Last Updated**: 2026-01-15
**Status**: Fix ready for deployment
