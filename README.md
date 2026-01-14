# Chatly MVP

**Multi-channel Conversation Management Platform** (WhatsApp, Instagram, Messenger).

## 🚀 Overview
Chatly integrates social messaging channels into a unified interface for businesses. It leverages **Supabase** for real-time data and **NestJS** for robust backend logic.

## 🛠️ Tech Stack
- **Frontend**: React 18, Tailwind CSS, Vite
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL (Supabase), pgvector (AI/RAG)
- **Infrastructure**: Supabase (Auth, Storage, Edge Functions)

## 📂 Structure
- `backend/` - NestJS API and Services
- `frontend/` - React Application
- `llm.md` - **Architecture & Context Single Source of Truth**

## 🏁 Getting Started
1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📖 Documentation
See [llm.md](./llm.md) for detailed architecture, coding conventions, and schema info.
