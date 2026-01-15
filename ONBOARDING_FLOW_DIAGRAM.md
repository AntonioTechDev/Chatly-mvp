# Onboarding Flow Diagram

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REGISTRATION WIZARD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: PUBLIC (No Authentication Required)                   │
│  ────────────────────────────────────────────                   │
│  ┌────────────────────┐                                         │
│  │   Step 1: Signup   │─── @Public() ───────────────┐          │
│  │ Email & Password   │                              │          │
│  └────────────────────┘                              ▼          │
│                                                   Creates        │
│  ┌────────────────────┐                         auth.user       │
│  │   Step 2: Verify   │─── @Public() ───────────────┐          │
│  │   OTP (email)      │                              │          │
│  └────────────────────┘                              ▼          │
│         ▲                                        Verify OTP      │
│         │                                            │           │
│         │                             Create profile if needed   │
│         │                                    │                  │
│         └────────────────────────────────────┘                  │
│                                               │                  │
│                                        Returns Session          │
│                                        Tokens (JWT)             │
│                                               │                  │
├─────────────────────────────────────────────────────────────────┤
│                                               ▼                  │
│  PHASE 2: PROTECTED (JWT Authentication Required)               │
│  ──────────────────────────────────────────────                 │
│  ┌────────────────────┐                                         │
│  │   Step 3: Company  │─── Requires JWT ────────────────┐       │
│  │   Information      │   (accessToken in header)        │       │
│  └────────────────────┘                                 ▼       │
│                                              SupabaseAuthGuard  │
│  ┌────────────────────┐                       JWT Valid?        │
│  │   Step 4: Goals    │─── Requires JWT ─────────────────       │
│  │   & Channels       │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │   Step 5: Data     │─── Requires JWT ─────────────────       │
│  │   & Storage        │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │   Step 6: Team     │─── Requires JWT ─────────────────       │
│  │   & Settings       │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │  Step 7: Verify    │─── Requires JWT ─────────────────       │
│  │  Phone (SMS)       │                                         │
│  └────────────────────┘                                         │
│                                                                  │
│  ┌────────────────────┐                                         │
│  │    Complete        │─── Requires JWT ─────────────────       │
│  │  Onboarding        │                                         │
│  └────────────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### Step 1: Create User and Send OTP

```
Frontend                           Backend                       Supabase
   │                                 │                              │
   │ POST /api/onboarding/step-1    │                              │
   │ (email, password)               │                              │
   ├────────────────────────────────>│                              │
   │  NO Authorization Header         │                              │
   │                                  │ signUp(email, password)     │
   │                                  ├─────────────────────────────>
   │                                  │                              │
   │                                  │                    Creates   │
   │                                  │                    auth.user │
   │                                  │                              │
   │                                  │           Send OTP (Email)  │
   │                                  │<─────────────────────────────
   │                                  │                              │
   │ 200 OK                           │                              │
   │ {userId, email, message}         │                              │
   │<────────────────────────────────┤                              │
   │                                  │                              │
   │  [User sees: "Check email"]      │                              │
   │                                  │                              │

[User checks email, gets OTP code]
```

### Step 2: Verify OTP and Create Profile

```
Frontend                           Backend                       Supabase
   │                                 │                              │
   │ POST /api/onboarding/step-2     │                              │
   │ (email, otp)                    │                              │
   ├────────────────────────────────>│                              │
   │  NO Authorization Header         │                              │
   │                                  │ verifyOtp(email, otp)       │
   │                                  ├─────────────────────────────>
   │                                  │                              │
   │                                  │     Verify OTP & Return     │
   │                                  │     Session with JWT        │
   │                                  │<─────────────────────────────
   │                                  │                              │
   │                                  │ Check if profile exists      │
   │                                  │                              │
   │                                  │  [Profile not found]        │
   │                                  │                              │
   │                                  │ INSERT profile              │
   │                                  ├─────────────────────────────>
   │                                  │                              │
   │                                  │<─────────────────────────────
   │                                  │                              │
   │ 200 OK                           │                              │
   │ {                                │                              │
   │   userId,                        │                              │
   │   email,                         │                              │
   │   accessToken (JWT),             │                              │
   │   refreshToken,                  │                              │
   │   profile                        │                              │
   │ }                                │                              │
   │<────────────────────────────────┤                              │
   │                                  │                              │
   │ [Frontend stores accessToken]    │                              │
   │ [Redirects to Step 3]            │                              │
   │                                  │                              │
```

### Step 3+: Protected Endpoints

```
Frontend                           Backend                       Supabase
   │                                 │                              │
   │ POST /api/onboarding/step-3     │                              │
   │ (company info)                  │                              │
   ├────────────────────────────────>│                              │
   │ Authorization: Bearer {JWT}     │                              │
   │                                  │                              │
   │                          SupabaseAuthGuard                     │
   │                          @Post('step-3')                       │
   │                          NO @Public() decorator                │
   │                                  │                              │
   │                          Extract userId from JWT               │
   │                          Validate JWT with Supabase            │
   │                          ├─────────────────────────────────>   │
   │                          │                                      │
   │                          │<─────────────────────────────────   │
   │                          │       JWT is valid                   │
   │                                  │                              │
   │                          Call saveStep(userId, data)           │
   │                          ├─────────────────────────────────>   │
   │                          │  UPDATE platform_clients             │
   │                          │<─────────────────────────────────   │
   │                                  │                              │
   │ 200 OK {success: true}           │                              │
   │<────────────────────────────────┤                              │
   │                                  │                              │
   │ [User moves to Step 4]           │                              │
   │                                  │                              │
```

## Guard Logic: SupabaseAuthGuard

```
Request Arrives
      │
      ▼
Check @Public() Decorator
      │
      ├─── YES ──> Allow Request (return true)
      │                   │
      │                   ▼
      │            Process Handler
      │
      └─── NO ──> Validate JWT Token
                         │
                         ├─── Valid ──> Extract user from JWT
                         │               Set req.user.sub
                         │               Allow Request
                         │
                         └─── Invalid ──> Return 401 Unauthorized
```

## Data Flow: Profile Creation

```
Step 1: User Signup
  email + password
        │
        ▼
  Supabase.auth.signUp()
        │
        ├─── error? ──> Return 400 Bad Request
        │
        └─── success ──> Return userId
                            │
                            ▼
                        User receives OTP email

Step 2: OTP Verification
  email + otp
        │
        ▼
  Supabase.auth.verifyOtp()
        │
        ├─── error? ──> Return 401 Unauthorized
        │
        └─── success ──> Get userId from JWT
                            │
                            ▼
                        Check if profile exists
                            │
                            ├─── exists ──> Return profile
                            │
                            └─── not exists ──> INSERT profile
                                                    │
                                                    ├─── error? ──> Query again (may exist from trigger)
                                                    │
                                                    └─── success ──> Return profile

                                    Return Session Tokens
```

## Authentication Guard Flow Chart

```
                    Request → SupabaseAuthGuard
                         │
                         ▼
              canActivate(context)
                         │
                         ▼
         Check Reflector for @Public() Metadata
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
         @Public() ?           @Public() ?
         Found (true)          Not Found (false)
              │                     │
              ▼                     ▼
         return true          super.canActivate()
         (Allow)                    │
                                    ▼
                          Extract JWT from header
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                          ▼                   ▼
                      JWT Valid?         JWT Invalid?
                          │                   │
                          ▼                   ▼
                      Extract User      Return false
                    Set req.user.sub   (401 Unauthorized)
                          │
                          ▼
                     return true
                     (Allow)
```

## Database State During Flow

### After Step 1 Complete
```
auth.users table:
┌──────────────────────────────────┐
│ id                               │
│ email: automagruppoitalia@...    │
│ email_confirmed_at: null         │
│ created_at: 2024-01-15...        │
└──────────────────────────────────┘

profiles table:
[No record yet - created in Step 2]
```

### After Step 2 Complete
```
auth.users table:
┌──────────────────────────────────────────┐
│ id                                       │
│ email: automagruppoitalia@...            │
│ email_confirmed_at: 2024-01-15... (now)  │
│ created_at: 2024-01-15...                │
└──────────────────────────────────────────┘

profiles table:
┌──────────────────────────────────────────────────┐
│ id (matches auth.users.id)                       │
│ email: automagruppoitalia@...                    │
│ role: 'business_owner'                           │
│ phone_number: null                               │
│ phone_verified: false                            │
│ created_at: 2024-01-15...                        │
└──────────────────────────────────────────────────┘

platform_clients table:
[Created during Step 3 by ensurePlatformClient()]
```

### After Step 3+ Complete
```
platform_clients table:
┌──────────────────────────────────────────────┐
│ id                                           │
│ business_name: "Acme Corp"                   │
│ website: "https://acme.com"                  │
│ industry: "Technology"                       │
│ employee_count: "50-100"                     │
│ onboarding_step: 4 (after Step 3)            │
│ onboarding_status: 'in_progress'             │
│ created_at: 2024-01-15...                    │
└──────────────────────────────────────────────┘

profiles table:
┌──────────────────────────────────────────────┐
│ (same as before + )                          │
│ platform_client_id: {id from above}          │
└──────────────────────────────────────────────┘
```

## Error Handling Paths

### Step 1 Errors
```
POST /api/onboarding/step-1
      │
      ├─ Invalid email format ──> 400 Bad Request
      │
      ├─ Password < 8 chars ──> 400 Bad Request
      │
      ├─ Email already exists ──> 400 Bad Request
      │
      └─ Supabase error ──> 400 Bad Request
```

### Step 2 Errors
```
POST /api/onboarding/step-2/verify-otp
      │
      ├─ Invalid email format ──> 400 Bad Request
      │
      ├─ Invalid OTP format ──> 400 Bad Request
      │
      ├─ OTP expired ──> 401 Unauthorized
      │
      ├─ OTP incorrect ──> 401 Unauthorized
      │
      └─ Supabase error ──> 500 Internal Server Error
```

### Step 3+ Errors
```
POST /api/onboarding/step-3 (or any protected endpoint)
      │
      ├─ No Authorization header ──> 401 Unauthorized
      │
      ├─ Invalid JWT format ──> 401 Unauthorized
      │
      ├─ JWT expired ──> 401 Unauthorized
      │
      ├─ Invalid request body ──> 400 Bad Request
      │
      └─ Database error ──> 500 Internal Server Error
```

## Token Lifecycle

```
Step 1: POST /api/onboarding/step-1
        No token needed
        │
        ▼
Step 2: POST /api/onboarding/step-2/verify-otp
        No token yet
        │
        ▼ (Success returns accessToken + refreshToken)
        │
        ├─ Store accessToken (short-lived, ~1 hour)
        ├─ Store refreshToken (long-lived, ~7 days)
        │
        ▼
Step 3+: All endpoints
        Use accessToken in Authorization header
        │
        ├─ If accessToken expires ──> Use refreshToken to get new one
        │
        └─ If both expire ──> Return user to Step 1
```

## Summary

The fix implements a **clean separation of concerns**:

1. **Public Phase (Steps 1-2)**: Focus on authentication
   - Create account
   - Verify email
   - Obtain credentials

2. **Protected Phase (Steps 3+)**: Focus on onboarding
   - All requests authenticated
   - User identity verified
   - Profile/tenant setup complete
