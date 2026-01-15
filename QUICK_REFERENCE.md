# Quick Reference Card - Onboarding Authentication Fix

## Modified Files Summary

| File | Changes | Type |
|------|---------|------|
| `backend/src/common/decorators/public.decorator.ts` | NEW | Create decorator |
| `backend/src/common/guards/supabase-auth.guard.ts` | MODIFIED | Add public check |
| `backend/src/modules/onboarding/dtos/step1.dto.ts` | MODIFIED | Add password field |
| `backend/src/modules/onboarding/dtos/step2.dto.ts` | MODIFIED | Change to otp field |
| `backend/src/modules/onboarding/onboarding.controller.ts` | MODIFIED | Add @Public() decorators |
| `backend/src/modules/onboarding/onboarding.service.ts` | MODIFIED | Add 2 new methods |

## Public vs Protected Endpoints

```
STEP 1: POST /api/onboarding/step-1
├─ Auth: NOT REQUIRED
├─ Body: { email, password }
└─ Returns: { userId, message }

STEP 2: POST /api/onboarding/step-2/verify-otp
├─ Auth: NOT REQUIRED
├─ Body: { email, otp }
└─ Returns: { accessToken, refreshToken, profile }

STEP 3: POST /api/onboarding/step-3
├─ Auth: REQUIRED (Bearer token)
├─ Body: { companyName, website, industry, employeeCount }
└─ Returns: { success }

STEPS 4-7: Similar to Step 3 (all require auth)
```

## Authentication Guard Logic

```typescript
if (route has @Public()) {
  ✓ Allow request
} else {
  Check JWT token
  if (valid) ✓ Allow request
  else ✗ Return 401 Unauthorized
}
```

## New Service Methods

### createUserAndSendOTP()
```typescript
Input:  Step1Dto { email, password }
Output: { success, userId, email, message, needsOtpVerification }
Steps:
  1. Call supabase.auth.signUp(email, password)
  2. Supabase sends OTP automatically
  3. Return userId and message
```

### verifyOTPAndCreateProfile()
```typescript
Input:  Step2Dto { email, otp }
Output: { success, userId, email, accessToken, refreshToken, profile, readyForStep3 }
Steps:
  1. Call supabase.auth.verifyOtp(email, otp, 'signup')
  2. Create profile if doesn't exist
  3. Return session tokens
  4. Profile ready for Step 3+
```

## Frontend Integration Checklist

```
STEP 1 COMPONENT:
□ Call POST /api/onboarding/step-1
□ NO Authorization header
□ Store email locally
□ Show "Check email for OTP"
□ Redirect to Step 2

STEP 2 COMPONENT:
□ Call POST /api/onboarding/step-2/verify-otp
□ NO Authorization header
□ Extract accessToken from response
□ Extract refreshToken from response
□ Store tokens in localStorage/context
□ Redirect to Step 3

STEPS 3+ COMPONENTS:
□ Include Authorization header
□ Authorization: Bearer {accessToken}
□ Handle 401 errors
□ Redirect to Step 1 if unauthorized

AUTH CONTEXT:
□ Store accessToken
□ Store refreshToken
□ Store user profile
□ Provide logout function
```

## Error Codes & Handling

| Code | Cause | Solution |
|------|-------|----------|
| 400 | Invalid email/password/otp | Show validation error |
| 401 | Missing/invalid token | Redirect to Step 1 |
| 401 | OTP expired/incorrect | Ask to retry or start over |
| 500 | Server error | Show error, try again |

## Key Decorators & Functions

```typescript
// New decorator
@Public()  // Marks endpoint as public

// Service methods (new)
createUserAndSendOTP(dto: Step1Dto)
verifyOTPAndCreateProfile(dto: Step2Dto)

// Existing guard (modified)
SupabaseAuthGuard
  - Now checks for @Public() decorator
  - Skips JWT validation if public
  - Validates JWT if protected
```

## Data Flow

```
STEP 1
------
email + password
    ↓
Supabase creates auth.user
    ↓
Supabase sends OTP email
    ↓
Return userId

STEP 2
------
email + otp
    ↓
Verify OTP with Supabase
    ↓
Create profile (if needed)
    ↓
Return tokens (JWT)

STEPS 3+
--------
Use JWT token
    ↓
Access as authenticated user
    ↓
Access user ID from JWT
    ↓
Complete onboarding
```

## Important Notes

1. **Step 1-2 are PUBLIC** - No JWT needed
2. **Step 3+ are PROTECTED** - JWT required
3. **Tokens from Step 2** - Use for Steps 3+
4. **Profile auto-created** - In Step 2 response
5. **JWT validation** - Done in SupabaseAuthGuard
6. **No breaking changes** - Existing flows still work

## Testing Quick Commands

```bash
# Build backend
cd backend && npm run build

# Step 1: Create account
curl -X POST http://localhost:3000/api/onboarding/step-1 \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Step 2: Verify OTP
curl -X POST http://localhost:3000/api/onboarding/step-2/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Step 3: Company info (with token from Step 2)
curl -X POST http://localhost:3000/api/onboarding/step-3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{"companyName":"Acme","industry":"Tech","employeeCount":"50-100"}'
```

## Implementation Priority

1. **CRITICAL**: Step 1-2 endpoints (public)
2. **CRITICAL**: Token storage and usage
3. **IMPORTANT**: Steps 3-7 with auth header
4. **IMPORTANT**: Error handling (401)
5. **NICE-TO-HAVE**: Token refresh logic

## Common Mistakes to Avoid

1. ❌ Sending Authorization header to Step 1-2
2. ❌ NOT sending Authorization header to Step 3+
3. ❌ Not storing tokens from Step 2
4. ❌ Not handling 401 errors
5. ❌ Sending old Step 1 DTO format (with userId)
6. ❌ Sending old Step 2 DTO format (with emailVerified)

## Success Indicators

✓ User can register without account
✓ User receives OTP email
✓ User can verify OTP
✓ User receives session tokens
✓ User can access Steps 3+
✓ User cannot access Steps 3+ without token
✓ Redirects to Step 1 on 401

## Documentation Files

1. **ONBOARDING_FIX_SUMMARY.md** - Full details
2. **ONBOARDING_FLOW_DIAGRAM.md** - Visual diagrams
3. **IMPLEMENTATION_CHECKLIST.md** - Complete checklist
4. **FRONTEND_INTEGRATION_GUIDE.md** - Frontend code examples
5. **FIX_COMPLETE_SUMMARY.md** - Status and summary
6. **QUICK_REFERENCE.md** - This file

---

**Print this card and keep it nearby during integration!**
