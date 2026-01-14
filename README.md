# Chatly MVP

**Unified Inbox for Multi-Channel Social Conversations**

Chatly centralizes WhatsApp, Instagram, and Messenger interactions into a single, real-time dashboard for business efficiency.

## 🚀 Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: NestJS (API, Security, Notifications)
- **Database**: Supabase (PostgreSQL, Vector Embeddings)
- **Automation**: n8n

## 📂 Project Structure

| Directory | Description |
|-----------|-------------|
| `/backend` | NestJS Application source code |
| `/frontend` | React Application source code |
| `/supabase` | Database migrations and schema documentation |
| `llm.md` | Context file for AI integration and architecture |

## 🛠 Getting Started

1. **Frontend**: `cd frontend && npm install && npm run dev`
2. **Backend**: `cd backend && npm install && npm run start:dev`
3. **Env**: Copy `.env.example` to `.env` in both directories.

## 📄 Documentation

- **Database Schema**: [supabase/SCHEMA.md](./supabase/SCHEMA.md)
- **AI Context & Guidelines**: [llm.md](./llm.md)

## 🔒 Security

- **Tokens**: Stored in Supabase Vault (encrypted).
- **Data**: Hard delete policy active.
- **Access**: Row Level Security (RLS) enabled on all tables.
