Chatly MVP - Architettura Essenziale
Overview
Chatly MVP visualizza conversazioni multi-canale.
I dati vengono raccolti da n8n, l'app solo legge e mostra dal database Supabase.

Stack Tecnologico

React 18 + TypeScript 
Tailwind CSS
Supabase (database + auth + real-time)
React Router

Struttura Progetto Semplificata
chatly-mvp/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── components/          # TUTTI i componenti
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ChatView.tsx
│   │   ├── Message.tsx
│   │   ├── ContactDetail.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   │
│   ├── pages/               # Pagine route
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   └── Conversations.tsx
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useConversations.ts
│   │
│   ├── styles/              # CSS
│   │   └── index.css
│   │
│   ├── supabase.ts          # Client Supabase
│   ├── types.ts             # Tutti i tipi TypeScript
│   ├── App.tsx
│   └── main.tsx
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js

Funzionalità MVP
1. Autenticazione

Login
Registrazione
Logout
Sessione persistente

2. Layout Applicazione
┌─────────────┬──────────────────────────────┐
│             │                              │
│  SIDEBAR    │         CONTENUTO            │
│             │                              │
│ Dashboard   │  [Dashboard con report]      │
│ Conversaz.  │  oppure                      │
│             │  [Lista conversazioni del relativo social] → [Chat aperta]     │
│ WhatsApp    │                              │
│ Instagram   │                              │
│ Messenger   │                              │
│             │                              │
│ [Avatar]    │                              │
│ Logout      │                              │
└─────────────┴──────────────────────────────┘

3. Flusso Utente

Dashboard: Report generali (totale conversazioni, messaggi oggi, ecc.)
Click canale (es. WhatsApp) → Mostra lista conversazioni
Click conversazione → Apre chat a destra
Click avatar contatto → Mostra dettaglio con report generato dai dati dell'utente presi dal db