# Chatly MVP - LLM Context

## 1. Architecture Overview
Chatly MVP is a multi-channel conversation management platform (WhatsApp, Instagram, Messenger) utilizing a decoupled architecture.
- **Frontend**: React 18 SPA (Single Page Application) for UI/UX.
- **Backend**: NestJS for business logic, API endpoints, and orchestrating services.
- **Database**: Supabase (PostgreSQL) for persistence, authentication, real-time subscriptions, and vector embeddings.
- **Data Pipeline**: n8n for initial data collection loops (gradually interacting with Backend).
- **Security**: Hard delete policy, Encrypted tokens (Supabase Vault), RLS (Row Level Security) enabled on all tables.

## 2. Tech Stack
- **Languages**: TypeScript (Strict mode)
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Lucide React (Icons).
- **Backend**: NestJS (Modules, Controllers, Services, DTOs, Guards), Supabase Client.
- **Database**: PostgreSQL (Supabase), pgvector (Embeddings), pgcrypto, Supabase Vault.
- **AI/RAG**: OpenAI Embeddings (text-embedding-ada-002), pgvector for semantic search.

## 3. Project Structure
```
/
├── backend/                 # NestJS Application
│   ├── src/
│   │   ├── common/          # Shared guards, interfaces, decorators
│   │   ├── modules/         # Feature modules (Auth, Onboarding, Notifications)
│   │   └── database/        # Migrations and SQL scripts
│   └── package.json
│
├── frontend/                # React Application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route views
│   │   ├── hooks/           # Custom React hooks
│   │   └── core/            # API clients, contexts, constants
│   └── package.json
│
├── docs/                    # [DEPRECATED -> see llm.md]
├── .gitignore               # Standard gitignore
└── llm.md                   # This file (Single Source of Truth)
```

## 4. Key Conventions
- **Code Style**:
  - Use `kebab-case` for filenames.
  - Use `PascalCase` for Classes/Components.
  - Use `camelCase` for variables/functions.
  - Strict TypeScript types (avoid `any`).
- **Backend**:
  - Modular architecture (Feature-based).
  - Controller-Service-Repository pattern (using Supabase as Repo layer often).
  - Validation via DTOs (`class-validator`).
- **Database**:
  - **RLS**: Mandatory for all tables.
  - **Vector Search**: Use `vector` extension with HNSW indices.
  - **Secrets**: Never store tokens in plain text; use Supabase Vault.
  - **IDs**: Use UUIDs or BigInts (consistent usage required).

## 5. Database Schema Highlights
- **`platform_clients`**: Business entities (Tenants). Holds encrypted tokens/secrets references.
- **`social_contacts`**: End-users/Leads from social platforms.
- **`conversations`** & **`messages`**: Core chat data.
- **`documents`**: AI knowledge base with vector embeddings.
- **`profiles`**: Application users (mapped to `auth.users`).

## 6. Security Rules
- **Hard Delete**: Deleted records are permanently removed.
- **Token Storage**: Use `vault.secrets`. Store reference UUID in `platform_clients`.
- **Storage Paths**: `{user_id}/{category}/{timestamp}_{filename}`.
