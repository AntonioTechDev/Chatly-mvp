# Chatly MVP - LLM Context Document

## Project Overview

Chatly MVP is a multi-channel conversation management platform that unifies customer communications from WhatsApp, Instagram, and Messenger into a single interface. The application enables businesses to manage all social media conversations, contacts, and documents in one centralized dashboard with real-time updates.

**Core Value Proposition**: Eliminate channel-switching chaos by providing a unified inbox where business operators can view, respond to, and track all customer conversations across multiple platforms in real-time.

**Hybrid Architecture**: Chatly uses a hybrid approach:
- **Frontend**: Handles UI, visualization, and direct interactions with Supabase (Read-Heavy).
- **Backend (NestJS)**: Handles secure operations, sensitive API tokens (Meta), notifications (OTP/SMS/Email), and proxies webhooks to n8n logic.
- **n8n**: Orchestrates complex message flows and business automation.

## Technology Stack

- **Frontend**: React 18.3, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4
- **Backend**: NestJS 11 (Node.js 20+), Class-Validator, Axios
- **Database**: Supabase (PostgreSQL 15, Auth, Realtime, Storage, Vault)
- **External Services**:
  - **Meta Graph API**: Integrated via Backend proxy
  - **Twilio**: SMS/OTP delivery (Provider Agnostic Architecture)
  - **n8n**: Workflow automation
- **State Management**: React Context API (Frontend)
- **Deployment**: Vercel (Frontend), Railway/Render/VPS (Backend - TBD), Supabase Cloud (Database)

## Architecture Overview

### Project Structure (Monorepo-like)

The project is structured with the frontend in the root `src` and the backend in a dedicated `backend` directory.

```text
Chatly-mvp/
├── src/                # FRONTEND (React + Vite)
│   ├── core/           # Shared logic (Hooks, Contexts, Services)
│   ├── components/     # UI Components
│   └── pages/          # Application Routes
│
├── backend/            # BACKEND (NestJS)
│   ├── src/
│   │   ├── modules/    # Modular Feature Logic
│   │   │   ├── notifications/ # SMS/OTP (Twilio/Mock)
│   │   │   └── ...
│   │   └── main.ts     # Entry Point
│   └── ...
```

### Backend Layer (New)

The **NestJS Backend** was introduced to solve security and scalability challenges:
1.  **Security**: Storing long-lived tokens (Meta System User Tokens) server-side, never exposing them to the client.
2.  **Notifications**: Centralized OTP dispatching (Email/SMS) using the Strategy Pattern to allow swapping providers (Twilio, SendGrid, etc.).
3.  **Proxying**: Future-proofing the integration with n8n and Meta.

#### Backend Modules
-   **NotificationsModule**:
    -   Exposes `POST /notifications/otp`.
    -   Uses `TwilioProvider` for production SMS.
    -   Uses `MockNotificationProvider` for dev/testing (logs to console).
    -   Dynamic switching via `USE_MOCK_NOTIFICATIONS` env var.

### Frontend Layer

The frontend remains the primary interface for users, following a **strict layered architecture**:
1.  **Core Layer (`src/core`)**: Platform-agnostic business logic (ready for React Native).
2.  **Presentation Layer (`src/components`, `src/pages`)**: Web-specific UI.

## Database Schema (Supabase)

The database remains the source of truth, accessed by both Frontend (via `supabase-js` client) and Backend (via `supabase-js` admin client).

*(See previous documentation for full Schema details - tables: `platform_clients`, `social_contacts`, `conversations`, `messages`)*

## Key Integration Points

### 1. Notification System (OTP)
-   **Old Way**: Client-side simulation.
-   **New Way**:
    -   Client sends `POST /notifications/otp` to Backend.
    -   Backend validates DTO (`recipient`, `channel`).
    -   Backend uses the active Provider (Twilio/Mock) to send the code.
    -   Backend returns success/failure to Client.

### 2. Message Sending
-   **Current**: Frontend calls n8n webhook directly.
-   **Future Migration**: Frontend will call Backend `POST /messages`, which will perform validation/enrichment and then forward to n8n or Meta directly.

### 3. Authentication
-   **Frontend**: Uses Supabase Auth (Email/Password).
-   **Backend**: Will implement Guards to verify Supabase JWT tokens passed in the Authorization header.

## Critical Files

### Backend
-   `backend/src/app.module.ts`: Root module.
-   `backend/src/modules/notifications/notifications.module.ts`: Notification logic and provider factory.
-   `backend/src/modules/notifications/providers/twilio.provider.ts`: Twilio integration.
-   `backend/src/modules/notifications/dtos/send-otp.dto.ts`: Validation rules.
-   `backend/.env`: Environment variables (`TWILIO_ACCOUNT_SID`, etc.).

### Frontend
-   `src/core/contexts/AuthContext.tsx`: Auth state.
-   `src/services/authWizardService.ts`: Registration Wizard logic.
-   `src/components/auth/RegistrationWizard/`: Multi-step registration UI.

## Development Workflow

1.  **Start Frontend**: `npm run dev` (in root) - Port 5173
2.  **Start Backend**: `npm run start:dev` (in `backend/`) - Port 3000
3.  **Env Setup**: Ensure both root `.env` (Frontend) and `backend/.env` (Backend) are configured.

---

**Document Version**: 2.0
**Last Updated**: 2026-01-14
**Changes**: Added NestJS Backend, Twilio Integration, Backend Architecture.
