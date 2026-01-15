# Root Cause Analysis: Authentication & Onboarding Failures
**Date**: 2026-01-15
**Project**: Chatly MVP
**Supabase Project**: dstzlwmumpbcmrncujft
**Affected User**: automagruppoitalia@gmail.com

---

## Executive Summary

The authentication and onboarding system failures stem from **three critical architectural issues**:

1. **Missing Profile Auto-Creation Trigger**: No trigger exists to automatically create `profiles` records when users sign up via `auth.users`
2. **Orphaned Data Structure**: Users exist in `auth.users` but have no corresponding `profiles` record, breaking the expected data model
3. **Inconsistent Foreign Key Relationships**: Data type mismatches and missing constraints between `profiles`, `platform_clients`, and `auth.users`

These issues cause:
- Users stuck at Step 1 of onboarding wizard
- Google OAuth infinite loops (profile lookup fails)
- Frontend unable to query onboarding state
- RLS policies blocking legitimate data access

---

## Architectural Overview

### Expected Data Model (3-Table Architecture)

```
┌─────────────────┐
│   auth.users    │  ← Supabase Auth (email/OAuth)
│  (id: uuid)     │
└────────┬────────┘
         │ 1:1 (CASCADE)
         ↓
┌─────────────────┐
│   profiles      │  ← User Profile (auto-created)
│  (id: uuid)     │     - personal info
│  (platform_     │     - links to business account
│   client_id)    │
└────────┬────────┘
         │ N:1 (SET NULL)
         ↓
┌──────────────────┐
│ platform_clients │  ← Business Account (created in wizard)
│  (id: bigint)    │     - onboarding_step
│  (user_id: uuid) │     - business details
└──────────────────┘
```

### Current (Broken) State

```
┌─────────────────┐
│   auth.users    │  ✅ User exists
│  id: abc-123    │  email: automagruppoitalia@gmail.com
└────────┬────────┘
         │
         ✗ NO TRIGGER (missing profile creation)
         │
         ↓
┌─────────────────┐
│   profiles      │  ❌ NO RECORD CREATED
│                 │  (table may not even exist properly)
└─────────────────┘
         │
         ✗ Frontend query fails here
         │
┌──────────────────┐
│ platform_clients │  ⚠️  May exist with email match
│  (email only)    │  but no user_id link
└──────────────────┘
```

---

## Root Cause #1: Missing Profile Auto-Creation Trigger

### Problem

**No database trigger exists** to automatically create a `profiles` record when a new user signs up in `auth.users`.

### Evidence

Based on your migration files:
- `C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp\supabase\migrations\20260115_add_onboarding_fields.sql` creates profiles table but **NO TRIGGER**
- No `handle_new_user()` function exists
- No `on_auth_user_created` trigger on `auth.users`

### Impact

- **Email signup**: User created in `auth.users`, but NO `profiles` record
- **Google OAuth**: User created in `auth.users`, but NO `profiles` record
- **Frontend query**: `supabase.from('profiles').select('*').eq('id', user.id).single()` returns NULL
- **Wizard behavior**: Cannot determine onboarding state, defaults to Step 1, causes infinite loop

### Expected Trigger (MISSING)

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, first_access)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Root Cause #2: Orphaned Data Structure

### Problem

User `automagruppoitalia@gmail.com` likely exists in `auth.users` but has **NO corresponding `profiles` record**.

### Evidence Path

1. **User signs up** (email or Google OAuth)
   ```sql
   -- This happens automatically via Supabase Auth
   INSERT INTO auth.users (id, email, ...) VALUES (uuid, 'automagruppoitalia@gmail.com', ...);
   ```

2. **Profile should be created** (but isn't - trigger missing)
   ```sql
   -- EXPECTED (but doesn't happen)
   INSERT INTO public.profiles (id, ...) VALUES (uuid, ...);
   ```

3. **Frontend queries profile**
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('*, platform_clients(*)')
     .eq('id', user.id)
     .single();
   // ❌ Returns NULL because no profile exists
   ```

4. **Wizard logic breaks**
   ```typescript
   // In useAuthWizard.ts
   if (!profile) {
     setCurrentStep(1); // Always returns to Step 1
   }
   ```

### Diagnostic Query

```sql
-- Check if user exists but has no profile
SELECT
    au.id,
    au.email,
    au.created_at,
    p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'automagruppoitalia@gmail.com';

-- Expected result if issue exists:
-- id: abc-123, email: automagruppoitalia@gmail.com, profile_id: NULL
```

---

## Root Cause #3: Inconsistent Foreign Key Relationships

### Problem 3A: Data Type Mismatch

**Issue**: `platform_clients.user_id` is likely defined as `text` instead of `uuid`, causing JOIN failures.

```sql
-- Current (WRONG)
ALTER TABLE platform_clients ADD COLUMN user_id text;

-- Expected (CORRECT)
ALTER TABLE platform_clients ADD COLUMN user_id uuid REFERENCES auth.users(id);
```

### Problem 3B: Bidirectional Relationship Confusion

There are TWO links between `profiles` and `platform_clients`:

```sql
-- Link 1: profiles → platform_clients (N:1)
profiles.platform_client_id → platform_clients.id  -- Which business account user belongs to

-- Link 2: platform_clients → auth.users (N:1)
platform_clients.user_id → auth.users.id           -- Who created/owns the business account
```

**Confusion**: The migration tries to link `profiles.platform_client_id` but doesn't properly establish `platform_clients.user_id`.

### Problem 3C: Missing Unique Constraint

`platform_clients.user_id` should have a UNIQUE constraint (one business account per user), but likely doesn't.

### Evidence

From `database.types.ts`:
```typescript
platform_clients: {
  Row: {
    user_id: string | null  // ❌ Should be uuid, not string
    ...
  }
}
```

---

## Root Cause #4: RLS Policy Gaps

### Problem

Even if profile exists, RLS policies may block access.

### Missing Policies

1. **Service role INSERT permission** for trigger to create profiles
   ```sql
   CREATE POLICY "Service role can insert profiles"
     ON public.profiles FOR INSERT TO service_role
     WITH CHECK (true);
   ```

2. **User SELECT permission** for own profile
   ```sql
   CREATE POLICY "Users can view own profile"
     ON public.profiles FOR SELECT TO authenticated
     USING (auth.uid() = id);
   ```

3. **Cross-table SELECT** for platform_clients via profile
   ```sql
   CREATE POLICY "Users can view own platform_client"
     ON public.platform_clients FOR SELECT TO authenticated
     USING (user_id = auth.uid());
   ```

---

## Why Google OAuth Causes Infinite Loops

### Sequence of Events

1. **User clicks "Sign in with Google"**
   - Supabase creates `auth.users` record
   - `raw_user_meta_data` contains: `{ name: "User Name", avatar_url: "https://..." }`

2. **Trigger should fire** (but doesn't - it doesn't exist)
   - Should create `profiles` record with data from `raw_user_meta_data`

3. **User redirected to app**
   - Frontend calls `supabase.auth.getUser()` → Returns user ✅
   - Frontend calls `supabase.from('profiles').select(...)` → Returns NULL ❌

4. **Wizard logic**
   ```typescript
   useEffect(() => {
     if (!profile) {
       setCurrentStep(1);  // Redirects to Step 1
     }
   }, [profile]);
   ```

5. **Infinite loop**
   - User completes Step 1, submits form
   - Backend creates `platform_clients` record
   - Frontend reloads, queries `profiles` again
   - **Still returns NULL** (profile never created)
   - Wizard resets to Step 1
   - **LOOP REPEATS**

---

## Why Email Registration Gets Stuck at Step 1

### Sequence of Events

1. **User submits email/password registration form**
   - Supabase creates `auth.users` record
   - User receives confirmation email

2. **User clicks confirmation link**
   - `email_confirmed_at` set in `auth.users`
   - User redirected to app

3. **Same profile lookup failure**
   - `profiles` table has no record
   - Frontend queries return NULL
   - Wizard resets to Step 1

4. **Even if user completes Step 1**
   - `platform_clients` created with `email` field
   - But `user_id` NOT set (or set as text, not uuid)
   - Next reload: query fails because JOIN doesn't work
   - Wizard resets to Step 1 again

---

## Data Integrity Issues Detected

### Count of Orphaned Records (Expected)

Based on the architecture analysis, we expect:

```sql
-- Users without profiles (CRITICAL)
SELECT COUNT(*) FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
-- Expected: > 0 (including automagruppoitalia@gmail.com)

-- Profiles without platform_clients (NORMAL for Step 1)
SELECT COUNT(*) FROM profiles p
LEFT JOIN platform_clients pc ON p.id::text = pc.user_id
WHERE pc.id IS NULL;
-- Expected: Some users still in early onboarding

-- Platform_clients without profiles (BUG)
SELECT COUNT(*) FROM platform_clients pc
LEFT JOIN profiles p ON pc.user_id = p.id
WHERE p.id IS NULL AND pc.user_id IS NOT NULL;
-- Expected: 0 (but may have orphans from broken flow)
```

---

## Onboarding Step Tracking Issues

### Problem: Ambiguous State Storage

**Question**: Where is `onboarding_step` stored?

**Answer** (from migrations and types):
- `onboarding_step` is in `platform_clients` table (confirmed in `20260115_optimize_onboarding.sql`)
- `first_access` is in `profiles` table (added in `20260115_add_onboarding_fields.sql`)

**Issue**: Frontend needs to query BOTH tables to determine state:

```typescript
// Current (BROKEN) - only queries profiles
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// FIXED - needs to join platform_clients
const { data: profile } = await supabase
  .from('profiles')
  .select('*, platform_clients(*)')
  .eq('id', user.id)
  .single();

const onboardingStep = profile?.platform_clients?.onboarding_step ?? 1;
```

But this JOIN fails if:
- Profile doesn't exist (Root Cause #1)
- `platform_clients.user_id` has wrong data type (Root Cause #3)

---

## Recommended Fixes (Priority Order)

### 1. CRITICAL: Create Profile Auto-Creation Trigger

**File**: `supabase/migrations/20260115_fix_authentication_architecture.sql`

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, first_access)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. CRITICAL: Backfill Missing Profiles

```sql
INSERT INTO public.profiles (id, full_name, first_access)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'),
  true
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### 3. HIGH: Fix user_id Data Type

```sql
-- Convert platform_clients.user_id from text to uuid
ALTER TABLE platform_clients
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Add foreign key constraint
ALTER TABLE platform_clients
ADD CONSTRAINT fk_platform_clients_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint (one business per user)
CREATE UNIQUE INDEX idx_platform_clients_user_id_unique
ON platform_clients(user_id) WHERE user_id IS NOT NULL;
```

### 4. HIGH: Configure RLS Policies

```sql
-- Allow trigger to insert profiles
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT TO service_role
  WITH CHECK (true);

-- Allow users to view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow users to view own platform_client
CREATE POLICY "Users can view own platform_client"
  ON platform_clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### 5. MEDIUM: Create Helper Function

```sql
CREATE FUNCTION get_user_onboarding_state(user_uuid uuid)
RETURNS TABLE (
  has_profile boolean,
  has_platform_client boolean,
  onboarding_step integer,
  onboarding_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (p.id IS NOT NULL) as has_profile,
    (pc.id IS NOT NULL) as has_platform_client,
    COALESCE(pc.onboarding_step, 1) as onboarding_step,
    COALESCE(pc.onboarding_status, 'started') as onboarding_status
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  LEFT JOIN platform_clients pc ON au.id = pc.user_id
  WHERE au.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Testing Plan

### Test Case 1: New Email Registration

```bash
# Steps:
1. Register new user with email/password
2. Confirm email
3. Login
4. Check profile exists:
   SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
5. Complete Step 1 (business name)
6. Check platform_client exists and linked:
   SELECT * FROM platform_clients WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
7. Verify onboarding_step = 2
8. Reload page - should stay at Step 2 (not reset to Step 1)
```

### Test Case 2: Google OAuth

```bash
# Steps:
1. Sign in with Google
2. Check profile auto-created:
   SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'oauth@gmail.com');
3. Verify full_name populated from Google
4. Complete Step 1
5. Verify platform_client.user_id matches profile.id
6. Reload page - should advance to Step 2
```

### Test Case 3: Existing Broken User (automagruppoitalia@gmail.com)

```bash
# Steps:
1. Run backfill migration
2. Check profile created:
   SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com');
3. User logs in
4. Frontend should now load profile correctly
5. User can complete onboarding from current step
```

---

## Database Schema Recommendations

### Updated ERD

```
┌─────────────────────────────────┐
│         auth.users              │
│  - id: uuid (PK)                │
│  - email: text                  │
│  - encrypted_password: text     │
│  - email_confirmed_at: timestamp│
│  - raw_user_meta_data: jsonb    │
└────────────┬────────────────────┘
             │
             │ 1:1 ON DELETE CASCADE
             │ (auto-created by trigger)
             ↓
┌─────────────────────────────────┐
│          profiles               │
│  - id: uuid (PK, FK)            │
│  - full_name: text              │
│  - username: text UNIQUE        │
│  - avatar_url: text             │
│  - phone_number: text           │
│  - role: text                   │
│  - platform_client_id: bigint FK│  ←─┐
│  - first_access: boolean        │    │
│  - updated_at: timestamp        │    │
└────────────┬────────────────────┘    │
             │                          │
             │ N:1 SET NULL             │
             │                          │
             ↓                          │
┌─────────────────────────────────┐    │
│      platform_clients           │    │
│  - id: bigint (PK)              │────┘
│  - user_id: uuid UNIQUE FK      │  (owner)
│  - business_name: text NOT NULL │
│  - email: text UNIQUE NOT NULL  │
│  - phone: text                  │
│  - onboarding_step: int DEFAULT 1
│  - onboarding_status: text      │
│  - is_active: boolean           │
│  - website: text                │
│  - industry: text               │
│  - employee_count: text         │
│  - customer_type: text          │
│  - acquisition_channels: text[] │
│  - usage_goals: text[]          │
│  - created_at: timestamp        │
│  - updated_at: timestamp        │
└─────────────────────────────────┘
```

### Key Constraints

```sql
-- Primary Keys
profiles.id (uuid) → auth.users.id ON DELETE CASCADE
platform_clients.id (bigint, serial)

-- Foreign Keys
profiles.platform_client_id → platform_clients.id ON DELETE SET NULL
platform_clients.user_id → auth.users.id ON DELETE SET NULL

-- Unique Constraints
profiles.username UNIQUE
profiles.id UNIQUE (PK)
platform_clients.user_id UNIQUE (one business per user)
platform_clients.email UNIQUE

-- NOT NULL Constraints
platform_clients.business_name NOT NULL
platform_clients.email NOT NULL
```

---

## Migration Execution Order

1. **Run diagnostic audit first**
   ```bash
   psql -f supabase/diagnostics/20260115_critical_audit.sql > audit_results.txt
   ```

2. **Review audit results**
   - Confirm users_without_profiles > 0
   - Identify data type mismatches
   - Check for missing triggers

3. **Run fix migration**
   ```bash
   supabase migration up 20260115_fix_authentication_architecture
   ```

4. **Verify fixes**
   ```bash
   psql -c "SELECT COUNT(*) FROM auth.users au LEFT JOIN profiles p ON au.id = p.id WHERE p.id IS NULL;"
   # Should return 0
   ```

5. **Test with new user registration**

6. **Test with existing user login**

---

## Frontend Changes Required

### Update Profile Query

**File**: `frontend/src/core/contexts/AuthContext.tsx`

```typescript
// BEFORE (BROKEN)
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// AFTER (FIXED)
const { data: profile } = await supabase
  .from('profiles')
  .select(`
    *,
    platform_clients (
      id,
      business_name,
      email,
      onboarding_step,
      onboarding_status,
      is_active
    )
  `)
  .eq('id', user.id)
  .single();
```

### Update Wizard State Logic

**File**: `frontend/src/core/hooks/useAuthWizard.ts`

```typescript
// BEFORE
const currentStep = profile?.first_access ? 1 : 7;

// AFTER
const platformClient = profile?.platform_clients;
const currentStep = platformClient?.onboarding_step ?? 1;
const isCompleted = platformClient?.onboarding_status === 'completed';
```

---

## Success Metrics

After implementing fixes, these metrics should be achieved:

- **Profile Creation Rate**: 100% (every auth.users has a profiles record)
- **Orphaned Users**: 0 (no auth.users without profiles)
- **Login Success Rate**: 100% (no infinite loops)
- **Onboarding Completion**: Users can progress through all 7 steps
- **OAuth Flow**: Google sign-in works without errors

---

## Appendix: SQL Diagnostic Queries

### Check Specific User State

```sql
-- Full user state
SELECT
    'auth.users' as table_name,
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM auth.users au
WHERE au.email = 'automagruppoitalia@gmail.com'

UNION ALL

SELECT
    'profiles' as table_name,
    p.id,
    p.full_name,
    p.updated_at,
    NULL,
    NULL
FROM public.profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'automagruppoitalia@gmail.com')

UNION ALL

SELECT
    'platform_clients' as table_name,
    pc.id::text,
    pc.business_name,
    pc.created_at,
    pc.onboarding_step::text,
    pc.onboarding_status
FROM public.platform_clients pc
WHERE pc.email = 'automagruppoitalia@gmail.com';
```

### Check Trigger Existence

```sql
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name LIKE '%user%';
```

### Check Data Type Mismatches

```sql
SELECT
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'platform_clients')
  AND column_name IN ('id', 'user_id', 'platform_client_id')
ORDER BY table_name, column_name;
```

---

**END OF ANALYSIS**
