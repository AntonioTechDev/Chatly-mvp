# Chatly MVP - LLM Context

## 1. Project Overview
**Chatly MVP** is a multi-channel conversation management platform (WhatsApp, Instagram, Messenger) utilizing a decoupled architecture.
- **Value Proposition**: Unified inbox for business operators to manage social conversations without channel switching.
- **Status**: MVP Phase (Refactoring & Optimization).

## 2. Architecture
### Hybrid Architecture
- **Frontend (React 18 + Vite)**: Handles UI/UX, direct read-access to Supabase.
- **Backend (NestJS)**: Secure operations, API token management (Meta), Notifications (OTP), Webhook Proxy.
- **Database (Supabase)**: Source of Truth. PostgreSQL 15, Auth, Realtime, Vault (Secrets), Vector Embeddings.
- **Automation (n8n)**: Complex workflows and message orchestration.

### Folder Structure
```
Chatly-mvp/
├── backend/            # NestJS Application (Business Logic, Secure Ops)
│   ├── src/modules/    # Feature Modules (Auth, Onboarding, Notifications)
│   ├── .env            # Backend Env
│   └── package.json
├── frontend/           # React Application (UI, Client Logic)
│   ├── src/core/       # Shared Logic (Hooks, Contexts, Services)
│   ├── src/components/ # UI Components
│   └── package.json
├── supabase/           # Database Resources
│   ├── migrations/     # SQL Migrations
│   └── SCHEMA.md       # Full Database Schema Documentation
├── .gitignore          # Git Ignore Rules
├── llm.md              # Context File (This file)
└── README.md           # Project Entry Point
```

## 3. Tech Stack
- **Languages**: TypeScript (Strict), SQL.
- **Frontend**: React 18, Tailwind CSS 3.4, Lucide React, Axios.
- **Backend**: NestJS 11, Class-Validator, Twilio SDK (via Wrapper).
- **Database**: PostgreSQL 15 (Supabase), pgvector (Embeddings), pgcrypto, Supabase Vault.

## 4. Key Conventions
- **Naming**: `kebab-case` for files/folders, `PascalCase` for Classes/Components, `camelCase` for vars.
- **Security**:
  - **Hard Delete**: All deletes are permanent.
  - **Secrets**: Stored in **Supabase Vault**, referenced by UUID in tables (e.g., `platform_clients`).
  - **RLS**: Mandatory Row Level Security on all tables.
- **Onboarding**: 7-step wizard. Steps 1-2 unauthenticated (signup/OTP), Steps 3-7 authenticated (business data).

## 5. Authentication Architecture
### Database
- **Trigger**: `on_auth_user_created` auto-creates `profiles` record on user signup
- **Tables**: `auth.users` (Supabase Auth) → `profiles` → `platform_clients`
- **RLS**: Active on `profiles` and `platform_clients`
- **Migration**: `supabase/migrations/20260115_fix_authentication_architecture.sql`

### Backend (NestJS)
- **Public endpoints** (no JWT): `POST /onboarding/step-1`, `POST /onboarding/step-2/verify-otp`
- **Protected endpoints** (require JWT): `POST /onboarding/step-3` to `step-7`, all other routes
- **Decorator**: `@Public()` marks routes as unauthenticated
- **Guard**: `SupabaseAuthGuard` checks for `@Public()` metadata

### Frontend (React)
- **Routes**:
  - `/register` → redirects to `/onboarding/step-1`
  - `/onboarding/step-1` → Email/password signup (public)
  - `/onboarding/step-2` → OTP verification (public)
  - `/onboarding/step-3` to `/step-7` → Business data (protected)
  - `/auth/callback` → Google OAuth callback handler
- **Flows**:
  - Email: Step 1 (signup) → auto-redirect Step 2 (OTP) → auto-redirect Step 3
  - Google OAuth: Login → `/auth/callback` → Step 3 (new user) or smart resume
  - Login: Check DB onboarding_step → redirect to current step or dashboard
- **CSS**: `Wizard.css` imported globally in `main.tsx`

## 6. Implementation Guidelines
- **API First**: Complex logic moves to Backend modules. Frontend consumes Backend APIs for write ops/sensitive tasks.
- **Notification Strategy**: Provider-agnostic (Twilio/Mock) implementation in Backend.
- **Meta Integration**: System User tokens stored securely; Webhooks proxied through Backend.

## 7. Deployment
1. Apply migration: `supabase/migrations/20260115_fix_authentication_architecture.sql` in Supabase SQL Editor
2. Update Supabase OAuth redirect URLs to `/auth/callback` (not `/`)
3. Build: `npm run build` in backend and frontend directories

## 8. Resources
- **Schema**: `supabase/SCHEMA.md`
- **Migrations**: `supabase/migrations/`
- **UI/UX**: Standardized `Button` component with `isLoading` state; removed "Back" button for authenticated users in Step 3.
