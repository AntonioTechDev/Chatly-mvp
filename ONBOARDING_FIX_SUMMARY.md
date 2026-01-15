# Onboarding Authentication Flow Fix - Complete Summary

## Problem Statement
The registration wizard steps 1-2 required JWT authentication, but these steps are part of the signup process where users haven't authenticated yet. This caused new users (like `automagruppoitalia@gmail.com`) to get stuck at Step 1 without being able to proceed.

## Solution Overview
Implemented a **two-phase authentication strategy**:
- **Phase 1 (Steps 1-2)**: PUBLIC endpoints - no authentication required
- **Phase 2 (Steps 3-7)**: PROTECTED endpoints - JWT authentication required

## Files Modified

### 1. Created: Public Decorator
**File**: `backend/src/common/decorators/public.decorator.ts`

New decorator to mark routes as public and bypass authentication guards.

```typescript
export const Public = () => SetMetadata('isPublic', true);
```

### 2. Updated: SupabaseAuthGuard
**File**: `backend/src/common/guards/supabase-auth.guard.ts`

Modified to check for the `@Public()` decorator and skip authentication when present.

**Key Changes**:
- Added `Reflector` dependency injection
- Implemented logic to check metadata before validating JWT
- If route is public, returns `true` immediately (allows unauthenticated access)
- If route is protected, calls `super.canActivate()` to validate JWT

### 3. Updated: Step 1 DTO
**File**: `backend/src/modules/onboarding/dtos/step1.dto.ts`

Changed to accept email and password (not user ID).

```typescript
export class Step1Dto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

### 4. Updated: Step 2 DTO
**File**: `backend/src/modules/onboarding/dtos/step2.dto.ts`

Changed to accept email and OTP code for verification.

```typescript
export class Step2Dto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
```

### 5. Updated: Onboarding Controller
**File**: `backend/src/modules/onboarding/onboarding.controller.ts`

**Key Changes**:
- Added `@Public()` decorator to Step 1-2 endpoints
- Removed `@Request() req` parameter from public endpoints (not needed)
- Added comprehensive JSDoc comments
- Step 1 now calls `createUserAndSendOTP()` instead of `saveStep()`
- Step 2 now calls `verifyOTPAndCreateProfile()` instead of `saveStep()`
- All Step 3-7 endpoints remain protected (no `@Public()`)

**Public Endpoints**:
```typescript
@Post('step-1')
@Public()
async step1(@Body() dto: Step1Dto) {
  return this.onboardingService.createUserAndSendOTP(dto);
}

@Post('step-2/verify-otp')
@Public()
async step2(@Body() dto: Step2Dto) {
  return this.onboardingService.verifyOTPAndCreateProfile(dto);
}
```

**Protected Endpoints** (Step 3+):
```typescript
@Post('step-3')
async step3(@Request() req: RequestWithUser, @Body() dto: Step3Dto) {
  return this.onboardingService.saveStep(req.user.sub, { ...dto, currentStep: 4 });
}
// ... Step 4-7 similar
```

### 6. Updated: Onboarding Service
**File**: `backend/src/modules/onboarding/onboarding.service.ts`

**New Public Methods**:

#### `createUserAndSendOTP(dto: Step1Dto)`
- Creates Supabase auth.user with signUp
- Supabase automatically sends OTP to email
- Returns userId and confirmation message
- No authentication required (public method)

**Response**:
```typescript
{
  success: true,
  message: 'Account created. Check your email for the OTP code.',
  userId: '...',
  email: 'user@example.com',
  needsOtpVerification: true
}
```

#### `verifyOTPAndCreateProfile(dto: Step2Dto)`
- Verifies OTP token using `auth.verifyOtp()`
- Creates user profile if it doesn't exist
- Returns session tokens (access_token, refresh_token)
- No authentication required (public method)
- Enables authenticated requests for Step 3+

**Response**:
```typescript
{
  success: true,
  message: 'Email verified successfully',
  userId: '...',
  email: 'user@example.com',
  accessToken: '...',
  refreshToken: '...',
  profile: { /* profile data */ },
  readyForStep3: true
}
```

**Existing Protected Methods** (unchanged functionality):
- `getStatus(userId)` - Get onboarding status
- `saveStep(userId, data)` - Save step progress
- `sendPhoneVerification(userId)` - Step 7: Send SMS
- `verifyPhoneCode(userId, code)` - Step 7: Verify SMS
- `completeOnboarding(userId)` - Mark onboarding complete

## User Flow After Fix

### Before Registration
User visits `/onboarding/step-1` without authentication

### Step 1: Register Email & Password
1. User submits email + password
2. Frontend calls `POST /api/onboarding/step-1` (PUBLIC)
3. Backend creates Supabase auth.user
4. Supabase sends OTP to email automatically
5. Frontend redirects to Step 2

**Request**:
```json
POST /api/onboarding/step-1
{
  "email": "automagruppoitalia@gmail.com",
  "password": "SecurePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account created. Check your email for the OTP code.",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "automagruppoitalia@gmail.com",
  "needsOtpVerification": true
}
```

### Step 2: Verify OTP
1. User receives OTP email and enters code
2. Frontend calls `POST /api/onboarding/step-2/verify-otp` (PUBLIC)
3. Backend verifies OTP with Supabase
4. Backend creates user profile
5. Backend returns session tokens
6. Frontend stores tokens and redirects to Step 3

**Request**:
```json
POST /api/onboarding/step-2/verify-otp
{
  "email": "automagruppoitalia@gmail.com",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "automagruppoitalia@gmail.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "ref_token_...",
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "automagruppoitalia@gmail.com",
    "role": "business_owner",
    "phone_number": null,
    "phone_verified": false
  },
  "readyForStep3": true
}
```

### Step 3+: Authenticated Onboarding
1. Frontend includes `accessToken` in Authorization header
2. `SupabaseAuthGuard` validates JWT (no `@Public()` decorator)
3. User data extracted from JWT (`req.user.sub`)
4. Backend processes company info, preferences, etc.
5. Each step updates onboarding progress in database

**Request** (all Step 3+ endpoints):
```json
POST /api/onboarding/step-3
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
{
  "companyName": "Acme Corp",
  "website": "https://acme.com",
  "industry": "Technology",
  "employeeCount": "50-100"
}
```

## Security Implementation

### Public Endpoints (Step 1-2)
- No JWT validation required
- Input validation via DTOs (email format, password length, OTP format)
- Supabase handles credential security and OTP generation
- Rate limiting should be applied at infrastructure level

### Protected Endpoints (Step 3+)
- JWT token required in Authorization header
- Supabase authenticates token and provides `userId`
- `req.user.sub` contains verified user ID
- All operations scoped to authenticated user

### Guard Logic Flow
```
Request → @SupabaseAuthGuard
  ↓
Check if route has @Public() decorator
  ↓
YES → Allow request (public)
NO → Validate JWT and extract user
  ↓
JWT Valid → Set req.user and continue
JWT Invalid → Return 401 Unauthorized
```

## Testing Checklist

### Step 1 Tests
- [ ] POST `/api/onboarding/step-1` with valid email/password → 201 with userId
- [ ] POST `/api/onboarding/step-1` with invalid email → 400 Bad Request
- [ ] POST `/api/onboarding/step-1` with short password → 400 Bad Request
- [ ] Verify OTP email is sent (check Supabase logs)
- [ ] No Authorization header required

### Step 2 Tests
- [ ] POST `/api/onboarding/step-2/verify-otp` with valid OTP → 201 with accessToken
- [ ] POST `/api/onboarding/step-2/verify-otp` with invalid OTP → 401 Unauthorized
- [ ] POST `/api/onboarding/step-2/verify-otp` with invalid email format → 400 Bad Request
- [ ] Profile created automatically in database
- [ ] Session tokens included in response
- [ ] No Authorization header required

### Step 3+ Tests
- [ ] POST `/api/onboarding/step-3` without token → 401 Unauthorized
- [ ] POST `/api/onboarding/step-3` with valid token → 201 Success
- [ ] POST `/api/onboarding/step-3` with expired token → 401 Unauthorized
- [ ] All Step 3-7 endpoints require Authorization header

### End-to-End Flow
- [ ] Create account (Step 1)
- [ ] Verify OTP (Step 2)
- [ ] Receive accessToken
- [ ] Use accessToken for Steps 3-7
- [ ] Complete entire onboarding

## Environment Variables
Ensure your `.env` has:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
FRONTEND_URL=http://localhost:5173  # for dev
```

## Performance Notes
- Step 1: Fast (just creates auth user)
- Step 2: Fast (verifies OTP + creates profile)
- Step 3+: Profile query included in getStatus (can cache if needed)
- Consider adding rate limiting on public endpoints

## Backward Compatibility
- No breaking changes to Step 3-7 endpoints
- Old frontend code should continue working
- Update frontend to:
  1. Call Step 1 without authentication
  2. Store accessToken from Step 2 response
  3. Include token in headers for Step 3+

## Files Modified Summary
1. `backend/src/common/decorators/public.decorator.ts` - NEW
2. `backend/src/common/guards/supabase-auth.guard.ts` - MODIFIED
3. `backend/src/modules/onboarding/dtos/step1.dto.ts` - MODIFIED
4. `backend/src/modules/onboarding/dtos/step2.dto.ts` - MODIFIED
5. `backend/src/modules/onboarding/onboarding.controller.ts` - MODIFIED
6. `backend/src/modules/onboarding/onboarding.service.ts` - MODIFIED

All changes maintain backward compatibility and follow NestJS best practices.
