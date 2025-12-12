# Chatly MVP

Piattaforma di gestione conversazioni multi-canale (WhatsApp, Instagram, Messenger) con interfaccia unificata.

## Tecnologie

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Storage)
- **Styling**: Tailwind CSS + CSS Modules
- **Deploy**: Vercel

## Setup Rapido

### 1. Installa dipendenze

```bash
npm install
```

### 2. Configura variabili d'ambiente

Copia `.env.example` in `.env` e configura:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Setup database

Esegui gli script SQL nella cartella `database/` in questo ordine:
1. `db.sql` - Schema principale
2. `security_fixes.sql` - Configurazioni sicurezza
3. `generate_test_data.sql` - (Opzionale) Dati di test

### 4. Avvia sviluppo

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

## Comandi Principali

```bash
npm run dev        # Avvia dev server
npm run build      # Build per produzione
npm run preview    # Preview build locale
```

## Struttura Progetto

```
src/
├── components/    # UI Components organizzati per dominio
│   ├── ui/       # Componenti base riutilizzabili
│   ├── chat/     # Componenti chat (conversazioni, messaggi)
│   ├── documents/# Componenti documenti
│   ├── contacts/ # Componenti contatti
│   └── layout/   # Layout condivisi
├── contexts/     # React Context (AuthContext)
├── hooks/        # Custom hooks con business logic
├── lib/          # Utilities (supabase client, security)
├── pages/        # Pagine dell'applicazione
├── services/     # Servizi API esterni
└── types/        # TypeScript type definitions
```

## Architettura

Il progetto segue il pattern **Hooks → Components → Pages**:

1. **Hooks** (`hooks/`) - Gestiscono stato e business logic
2. **Components** (`components/`) - Solo rendering, ricevono dati via props
3. **Pages** (`pages/`) - Orchestrano hooks e components

Vedi [ARCHITECTURE.md](./ARCHITECTURE.md) per dettagli.

## Deploy su Vercel

1. Pusha il codice su GitHub
2. Importa progetto su Vercel
3. Configura variabili d'ambiente
4. Deploy automatico ad ogni push

Vedi [DEPLOYMENT.md](./DEPLOYMENT.md) per guida completa.

## Sicurezza

- Autenticazione via Supabase Auth
- Row Level Security (RLS) su tutte le tabelle
- Token OAuth criptati con Supabase Vault
- Validazione input e sanitizzazione

Vedi [SECURITY.md](./SECURITY.md) per dettagli.

## Documentazione

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architettura e pattern del codice
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guida deploy su Vercel
- [SECURITY.md](./SECURITY.md) - Note di sicurezza e best practices
- [CHANGELOG.md](./CHANGELOG.md) - Storia delle modifiche

## Supporto

Per domande o problemi, apri una issue su GitHub.
