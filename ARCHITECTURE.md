# 🏗️ Chatly MVP - Architecture Documentation

**Author:** Senior Architect Review
**Date:** 2026-01-16
**Status:** ✅ Cleaned & Documented

---

## 📊 Current Architecture

```
Chatly-mvp/
├── backend/                    # NestJS Backend API
│   ├── src/
│   │   ├── common/            # Shared utilities, guards, decorators
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication (future)
│   │   │   ├── onboarding/    # User registration & onboarding flow
│   │   │   └── notifications/ # SMS/Email notifications (Twilio)
│   │   └── main.ts
│   └── package.json
│
├── frontend/                   # React + Vite Web App
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Auth-related UI (Login, Onboarding)
│   │   │   ├── dashboard/     # Dashboard UI (protected)
│   │   │   └── ui/            # Reusable UI components (Button, etc)
│   │   │
│   │   ├── core/              # ⚠️ WEB-SPECIFIC "CORE" (NOT SHARED)
│   │   │   ├── api/           # API client (uses fetch, import.meta.env)
│   │   │   ├── contexts/      # React contexts (AuthContext)
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── lib/           # Supabase client (uses window, localStorage)
│   │   │   ├── services/      # Auth service (uses Supabase client)
│   │   │   └── types/         # ✅ TypeScript types (shareable)
│   │   │
│   │   ├── pages/             # Route pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── UpdatePasswordPage.tsx
│   │   │
│   │   ├── App.tsx            # Root component & routing
│   │   └── main.tsx           # Entry point
│   │
│   └── package.json
│
├── tests/                      # E2E tests (Playwright)
└── supabase/                   # Supabase migrations & config
```

---

## 🎯 Architecture Decisions

### 1. **Core Folder Stays in Frontend** ✅

**Reason:** The current `core` folder contains **100% web-specific code**:

| Folder | Web Dependencies | Shareable? |
|--------|------------------|------------|
| `core/api/` | `import.meta.env`, `fetch` | ❌ No |
| `core/lib/` | `window.location`, `localStorage`, Supabase Web SDK | ❌ No |
| `core/contexts/` | React Context, `react-hot-toast` | ❌ No |
| `core/hooks/` | React hooks | ❌ No |
| `core/services/` | Uses `core/lib/supabase` (web-specific) | ❌ No |
| `core/types/` | Pure TypeScript types | ✅ **YES** |

**Conclusion:** Moving `core` to root would be premature. It's currently a web-specific business logic layer.

---

### 2. **Future "Shared Core" Strategy** 🔮

When building the native app, create a **true shared core**:

```
Chatly-mvp/
├── packages/
│   ├── shared/               # NEW: Truly shared code
│   │   ├── types/           # Shared TypeScript types
│   │   ├── utils/           # Platform-agnostic utilities
│   │   ├── constants/       # API endpoints, config
│   │   └── validators/      # Form validation logic
│   │
│   ├── web/                 # Renamed from "frontend"
│   │   └── src/
│   │       ├── core/        # Web-specific business logic
│   │       ├── components/  # React components
│   │       └── pages/       # Web pages
│   │
│   └── mobile/              # NEW: React Native app
│       └── src/
│           ├── core/        # Mobile-specific business logic
│           ├── components/  # React Native components
│           └── screens/     # Mobile screens
│
└── backend/                 # NestJS API (unchanged)
```

**Implementation:**
- Use **monorepo** (pnpm workspaces or Nx)
- `packages/shared` → Pure TypeScript, no platform dependencies
- `packages/web/core` → Web-specific (fetch, window, React Context)
- `packages/mobile/core` → Mobile-specific (AsyncStorage, React Native APIs)

---

## 📧 Email Flow Analysis

### **Question:** How are emails sent during registration?

**Answer:** ✅ **Supabase handles email automatically**

### Flow Breakdown:

#### **Step 1: User Registration**
```typescript
// backend/src/modules/onboarding/onboarding.service.ts:47-54

const { data, error } = await this.supabase.auth.signUp({
  email: dto.email,
  password: dto.password,
  options: {
    emailRedirectTo: `${FRONTEND_URL}/onboarding/step-2`,
  },
});
```

**What happens:**
1. Backend calls `supabase.auth.signUp()`
2. Supabase **automatically sends** an email with a 6-digit OTP code
3. Email is sent using **Supabase's SMTP settings** (configured in dashboard)
4. No manual API call needed

#### **Step 2: Email Verification**
```typescript
// Frontend: OnboardingPage.tsx (Step 2)
// User enters the 6-digit code received via email

await apiClient('/onboarding/step-2/verify-otp', {
  method: 'POST',
  body: JSON.stringify({ email, otp })
})

// Backend: onboarding.service.ts:101-120
const { data, error } = await this.supabase.auth.verifyOtp({
  email: dto.email,
  token: dto.otp,
  type: 'signup',
});
```

**What happens:**
1. Frontend sends OTP to backend
2. Backend verifies OTP with Supabase
3. Supabase validates the code
4. If valid, user is authenticated

#### **Resend OTP**
```typescript
// Frontend only (not implemented in current simplified version)
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: email,
});
```

**What happens:**
- Supabase sends a **new OTP** to the same email
- No backend call needed (can be done directly from frontend)

---

### **Email Configuration:**

You configured Supabase Email Settings in the dashboard:
- **SMTP Provider:** Supabase default OR custom SMTP
- **Email Templates:** Customizable in Supabase dashboard
- **From Address:** `noreply@chatly.app` (or your domain)

**Key Point:** We never manually send emails. Supabase Auth handles:
- OTP generation
- Email sending
- Email templates
- Rate limiting
- OTP expiration (default: 60 seconds)

---

## 🗂️ Cleaned Components

### **Removed Deprecated Folders:**
- ❌ `components/chat/` - Legacy chat UI
- ❌ `components/contacts/` - Legacy contacts management
- ❌ `components/documents/` - Legacy documents UI
- ❌ `components/layout/` - Old layout components (replaced by ProtectedRoute)

### **Current Components:**
- ✅ `components/auth/` - Authentication UI (Login, Onboarding, AuthCallback)
- ✅ `components/dashboard/` - Dashboard-specific components
- ✅ `components/ui/` - Reusable UI components (Button, etc.)

---

## 📱 Mobile App Preparation Checklist

When ready to build the native app:

1. **Create `packages/shared/`**
   - [ ] Move `types/` from `frontend/src/core/types/`
   - [ ] Create platform-agnostic API client interface
   - [ ] Extract validation logic

2. **Refactor `frontend/` → `packages/web/`**
   - [ ] Keep current `core/` as web-specific
   - [ ] Rename folder to clarify it's web-only

3. **Create `packages/mobile/`**
   - [ ] Set up React Native
   - [ ] Create mobile-specific `core/`
   - [ ] Implement `core/api/` using `fetch` (or axios)
   - [ ] Implement `core/storage/` using `AsyncStorage` (not localStorage)

4. **Backend Remains Unchanged**
   - Backend API is already platform-agnostic
   - Returns JSON, works with web & mobile

---

## 🎨 Current Routing

```typescript
// frontend/src/App.tsx

/ → /login
/login → LoginPage
/register → OnboardingPage (7 steps)
/auth/callback → AuthCallback (OAuth redirect)
/forgot-password → ForgotPasswordPage
/update-password → UpdatePasswordPage
/dashboard → DashboardPage (protected)
```

**Protected Routes:** Use `ProtectedRoute` component (checks authentication)

---

## 🔐 Authentication Flow

1. **Registration:**
   - User → `/register`
   - Step 1: Email/Password → Backend `/api/onboarding/step-1`
   - Backend → Supabase `auth.signUp()` → **Email sent automatically**
   - Step 2: OTP Verification → Backend `/api/onboarding/step-2/verify-otp`
   - Step 3-7: Onboarding data → Backend saves to DB
   - Redirect → `/dashboard`

2. **Login:**
   - User → `/login`
   - Frontend → `authService.signInWithPassword()`
   - Direct Supabase call (no backend)
   - Redirect → `/dashboard`

3. **Session Management:**
   - Supabase stores session in `localStorage` (key: `chatly-auth-token`)
   - `AuthContext` manages session state
   - `ProtectedRoute` checks authentication before rendering

---

## ✅ Summary

**Completed Actions:**
1. ✅ Removed deprecated components (`chat`, `contacts`, `documents`, `layout`)
2. ✅ Analyzed `core/` folder - **Stays in frontend** (web-specific)
3. ✅ Documented email flow - **Supabase handles automatically**
4. ✅ Created architecture documentation

**Current State:**
- Clean, minimal codebase
- Only essential auth/onboarding components
- Backend-driven architecture
- Ready for future mobile app (with proper refactoring)

**Email Flow:**
- ✅ Supabase `auth.signUp()` → Automatic email with OTP
- ✅ No manual SMTP calls
- ✅ Configured in Supabase dashboard
