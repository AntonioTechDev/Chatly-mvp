# Onboarding Authentication Fix - Implementation Checklist

## Overview
This document tracks the implementation of the two-phase authentication strategy for the registration wizard.

## Phase 1: Backend Implementation (COMPLETED)

### A. Create Public Decorator
- [x] Create `backend/src/common/decorators/public.decorator.ts`
- [x] Export `Public()` function that sets isPublic metadata
- [x] JSDoc documentation

### B. Update SupabaseAuthGuard
- [x] Add `Reflector` dependency injection
- [x] Override `canActivate()` method
- [x] Check for @Public() metadata
- [x] Skip JWT validation if route is public
- [x] Validate JWT if route is protected
- [x] Return appropriate boolean/Promise

### C. Update DTOs
- [x] **Step1Dto**: Update to accept `email` and `password`
  - Email validation (@IsEmail)
  - Password validation (8+ chars)
  - Remove userId field

- [x] **Step2Dto**: Update to accept `email` and `otp`
  - Email validation (@IsEmail)
  - OTP string validation
  - Remove emailVerified boolean field

### D. Update Controller
- [x] Import Public decorator
- [x] Import Step2Dto
- [x] Mark Step 1 endpoint with @Public()
  - Change method to call `createUserAndSendOTP()`
  - Remove @Request() req parameter
  - Remove req.user.sub usage

- [x] Mark Step 2 endpoint with @Public()
  - Change path to `/step-2/verify-otp`
  - Change method to call `verifyOTPAndCreateProfile()`
  - Remove @Request() req parameter
  - Remove req.user.sub usage

- [x] Keep Step 3-7 endpoints protected
  - No @Public() decorator
  - All require @Request() req parameter
  - All use req.user.sub for userId

- [x] Add JSDoc comments to all endpoints
  - Indicate which are PUBLIC vs PROTECTED
  - Explain what each endpoint does

### E. Update Service
- [x] Import BadRequestException, UnauthorizedException
- [x] Import Step1Dto, Step2Dto
- [x] Implement `createUserAndSendOTP(dto: Step1Dto)`
  - Call `supabase.auth.signUp()`
  - Handle signUp errors with BadRequestException
  - Return userId, email, and confirmation message
  - No session token returned yet

- [x] Implement `verifyOTPAndCreateProfile(dto: Step2Dto)`
  - Call `supabase.auth.verifyOtp()`
  - Handle OTP errors with UnauthorizedException
  - Check if profile exists
  - Create profile if missing
  - Return session tokens (accessToken, refreshToken)
  - Return profile data
  - Return readyForStep3 flag

- [x] Add JSDoc to public methods
  - Explain they are public endpoints
  - Explain no authentication required
  - Explain what Supabase handles automatically

- [x] Keep existing methods unchanged
  - getStatus() - protected
  - saveStep() - protected
  - ensurePlatformClient() - private helper
  - sendPhoneVerification() - protected
  - verifyPhoneCode() - protected
  - completeOnboarding() - protected

### F. Verify Build
- [x] Run `npm run build` in backend directory
- [x] No TypeScript errors
- [x] All imports resolve correctly

## Phase 2: Frontend Integration (TO DO - Frontend Engineer)

### A. Update Step 1 Component (WizardStep1.tsx)
- [ ] Change request payload to:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- [ ] Remove dependency on JWT token
- [ ] Handle response with userId
- [ ] Store userId locally or in state
- [ ] Redirect to Step 2

### B. Update Step 2 Component (WizardStep2.tsx)
- [ ] Change request payload to:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- [ ] Remove dependency on JWT token
- [ ] Extract accessToken from response
- [ ] Extract refreshToken from response
- [ ] Store tokens in secure storage (localStorage, sessionStorage, or context)
- [ ] Store user profile data
- [ ] Redirect to Step 3 with tokens available

### C. Update Steps 3-7 Components
- [ ] Ensure Authorization header is set:
  ```
  Authorization: Bearer {accessToken}
  ```
- [ ] Handle 401 Unauthorized responses
  - Redirect to Step 1 if token invalid/expired
  - Attempt token refresh if refreshToken available
- [ ] Continue existing implementation

### D. Update Auth Context (AuthContext.tsx)
- [ ] Add storage for accessToken and refreshToken
- [ ] Add storage for user profile from Step 2
- [ ] Update login logic to handle new token format
- [ ] Add token refresh mechanism
- [ ] Persist tokens across page reloads

### E. Update Auth Service (authService.ts / authWizardService.ts)
- [ ] Add `createUserAndSendOTP()` method
- [ ] Add `verifyOTPAndCreateProfile()` method
- [ ] Update to use new Step 1-2 endpoints
- [ ] Handle token management from Step 2 response

### F. Update API Client
- [ ] Ensure Authorization header is added to all requests
- [ ] Add token refresh interceptor
- [ ] Handle 401 responses with token refresh

## Phase 3: Testing

### A. Backend API Tests
- [ ] Step 1 endpoint accepts email/password
- [ ] Step 1 endpoint rejects invalid email
- [ ] Step 1 endpoint rejects short password
- [ ] Step 1 endpoint creates Supabase auth user
- [ ] Step 1 endpoint sends OTP email
- [ ] Step 1 does NOT require Authorization header
- [ ] Step 2 endpoint accepts email/otp
- [ ] Step 2 endpoint rejects invalid OTP
- [ ] Step 2 endpoint creates profile if missing
- [ ] Step 2 endpoint returns accessToken
- [ ] Step 2 endpoint returns refreshToken
- [ ] Step 2 endpoint does NOT require Authorization header
- [ ] Step 3+ endpoints require Authorization header
- [ ] Step 3+ endpoints reject invalid token
- [ ] Step 3+ endpoints reject missing token

### B. End-to-End Flow Tests
- [ ] User can register without account (Step 1)
- [ ] User receives OTP email
- [ ] User can verify OTP (Step 2)
- [ ] User receives session tokens
- [ ] User can access Step 3 with token
- [ ] User cannot access Step 3 without token
- [ ] Complete onboarding from Step 1-7

### C. Error Handling Tests
- [ ] Invalid email format on Step 1
- [ ] Duplicate email on Step 1
- [ ] Invalid password on Step 1
- [ ] Expired OTP on Step 2
- [ ] Invalid OTP on Step 2
- [ ] Missing Authorization header on Step 3+
- [ ] Invalid token on Step 3+
- [ ] Expired token on Step 3+

### D. Edge Cases
- [ ] User tries Step 2 before Step 1
- [ ] User tries Step 3 before Step 2
- [ ] User tries to re-register with same email
- [ ] User leaves Step 1 and returns later
- [ ] User closes browser during Step 2 and returns
- [ ] Multiple OTP requests
- [ ] Multiple Step 2 verification attempts

## Phase 4: Documentation

### A. Developer Documentation
- [x] ONBOARDING_FIX_SUMMARY.md - Complete summary
- [x] ONBOARDING_FLOW_DIAGRAM.md - Visual flows and diagrams
- [x] IMPLEMENTATION_CHECKLIST.md - This file

### B. Code Documentation
- [x] JSDoc comments on controller endpoints
- [x] JSDoc comments on service methods
- [x] Inline comments on complex logic
- [x] Guard logic explanation

### C. Frontend Developer Guide (TO DO)
- [ ] How to use new Step 1-2 endpoints
- [ ] How to store and use tokens
- [ ] How to handle token refresh
- [ ] How to handle 401 errors
- [ ] Example code snippets

## Deployment Checklist

### A. Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] No security issues identified
- [ ] Database schema validated
- [ ] Environment variables configured

### B. Staging Deployment
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Test full flow in staging
- [ ] Verify email sending works
- [ ] Check error handling

### C. Production Deployment
- [ ] Set maintenance window
- [ ] Deploy backend first
- [ ] Deploy frontend second
- [ ] Monitor logs for errors
- [ ] Test new user registration
- [ ] Verify existing users can still login

## Environment Variables Checklist

### A. Backend .env
- [ ] SUPABASE_URL - Set correctly
- [ ] SUPABASE_SERVICE_ROLE_KEY - Set correctly
- [ ] FRONTEND_URL - Set for email redirect URL
- [ ] VITE_SUPABASE_URL - If used by SDK
- [ ] VITE_SUPABASE_ANON_KEY - If used by SDK

### B. Frontend .env
- [ ] VITE_SUPABASE_URL - Set correctly
- [ ] VITE_SUPABASE_ANON_KEY - Set correctly
- [ ] VITE_API_URL - Backend API URL

## Rollback Plan

If issues occur post-deployment:

1. **Immediate** (within 5 minutes):
   - [ ] Revert backend changes
   - [ ] Revert frontend changes
   - [ ] Clear browser cache
   - [ ] Notify users if needed

2. **Short-term** (within 1 hour):
   - [ ] Identify root cause in logs
   - [ ] Create patch or rollback PR
   - [ ] Test patch in staging
   - [ ] Redeploy fixed version

3. **Post-incident**:
   - [ ] Review what went wrong
   - [ ] Update tests to catch issue
   - [ ] Document lessons learned
   - [ ] Update deployment checklist

## Success Criteria

- [ ] User can complete Step 1 without JWT token
- [ ] User can complete Step 2 without JWT token
- [ ] User receives session tokens after Step 2
- [ ] User can complete Steps 3-7 with JWT token
- [ ] User cannot access Steps 3-7 without JWT token
- [ ] All validations working as expected
- [ ] Error messages clear and helpful
- [ ] Email OTP delivery working
- [ ] No breaking changes to existing functionality
- [ ] Performance acceptable (< 500ms per request)
- [ ] No security vulnerabilities introduced

## Sign-Off

- [ ] Backend Engineer: Completed and tested
- [ ] Frontend Engineer: Integrated and tested
- [ ] QA: Full test suite passed
- [ ] Product Manager: Approved for production
- [ ] DevOps: Deployment prepared

## Notes

- All Step 1-2 endpoints marked with @Public() decorator
- All Step 3-7 endpoints require JWT in Authorization header
- Supabase handles OTP generation and email sending
- Profile created automatically in Step 2
- Platform client created on first demand (Step 3)
- No breaking changes to existing Step 3-7 endpoints

---

Last Updated: 2026-01-15
Status: BACKEND IMPLEMENTATION COMPLETE - AWAITING FRONTEND INTEGRATION
