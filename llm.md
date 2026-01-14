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
- **Onboarding**: Flows managed via Backend stats (proposed) + Frontend Wizard.

## 5. Implementation Guidelines
- **API First**: Complex logic moves to Backend modules. Frontend consumes Backend APIs for write ops/sensitive tasks.
- **Notification Strategy**: Provider-agnostic (Twilio/Mock) implementation in Backend.
- **Meta Integration**: System User tokens stored securely; Webhooks proxied through Backend.

## 6. Resources
- **Schema**: See `supabase/SCHEMA.md`.
- **Migrations**: See `supabase/migrations/`.
