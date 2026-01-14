# Chatly MVP

Piattaforma di gestione conversazioni multi-canale (WhatsApp, Instagram, Messenger) con interfaccia unificata per gestire tutti i messaggi dei clienti in un unico posto.

## Cosa fa l'app

- **Gestione conversazioni**: Chat unificate da WhatsApp, Instagram e Messenger
- **Gestione contatti**: Database contatti con informazioni e storico
- **Gestione documenti**: Upload, visualizzazione e download documenti
- **Real-time**: Aggiornamenti live delle conversazioni e messaggi
- **Autenticazione**: Login sicuro con gestione profili aziendali

## Tecnologie

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Storage + Auth)
- **Styling**: Tailwind CSS + CSS Modules
- **Deploy**: Vercel

---

## Setup Progetto

### 1. Installa dipendenze

```bash
npm install
```

### 2. Configura variabili d'ambiente

Copia `.env.example` in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup database

In Supabase SQL Editor, esegui gli script nella cartella `database/`:

1. `db.sql` - Schema completo (tabelle, RLS, indexes)
2. `security_fixes.sql` - Policies di sicurezza
3. `generate_test_data.sql` - (Opzionale) Dati di test

### 4. Avvia sviluppo

```bash
npm run dev
```

App disponibile su: `http://localhost:5173`

### Comandi

```bash
npm run dev        # Dev server con hot reload
npm run build      # Build produzione
npm run preview    # Preview build locale
```

---

## Struttura Progetto

```
src/
├── components/         # Componenti UI organizzati per dominio
│   ├── ui/            # Componenti base riutilizzabili (Card, Button, Badge, etc.)
│   ├── chat/          # Componenti chat (ConversationCard, MessageCard, etc.)
│   ├── documents/     # Componenti documenti (DocumentCard, DocumentsList, etc.)
│   ├── contacts/      # Componenti contatti (ContactCard, ContactsList, etc.)
│   └── layout/        # Layout condivisi (MainSidebar, ProtectedRoute, etc.)
│
├── contexts/          # React Context per stato globale
│   └── AuthContext.tsx    # Autenticazione e dati utente
│
├── hooks/             # Custom hooks con business logic
│   ├── useDocuments.ts    # Gestione documenti
│   ├── useConversations.ts # Gestione conversazioni
│   ├── useMessages.ts     # Gestione messaggi
│   └── useContacts.ts     # Gestione contatti
│
├── lib/               # Utilities generiche riutilizzabili
│   ├── supabase.ts        # Client Supabase configurato
│   ├── security-utils.ts  # Funzioni sicurezza (sanitize, validate)
│   └── tokenManager.ts    # Gestione token OAuth criptati
│
├── services/          # API calls pure (senza stato React)
│   ├── conversationService.ts  # API conversazioni
│   ├── messageService.ts       # API messaggi
│   └── contactService.ts       # API contatti
│
├── pages/             # Pagine applicazione (orchestrano tutto)
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── InboxPage.tsx
│   ├── DocumentsPage.tsx
│   └── ContactsPage.tsx
│
└── types/             # TypeScript type definitions
    └── database.types.ts  # Tipi generati da Supabase
```

---

## Architettura: Come Funzionano le Chiamate

Il progetto segue una **architettura a strati** chiara e separata:

```
📱 User Interaction
    ↓
🎯 Pages (Orchestrazione)
    ↓
🎣 Hooks (Business Logic + Stato React)
    ↓
📡 Services (API Calls Pure)
    ↓
🔧 Lib (Utilities + Client Configurato)
    ↓
🗄️ Supabase (Database + Storage + Auth)
```

### Esempio Pratico: Caricare Documenti

#### 1. **lib/** - Configurazione Base

```typescript
// lib/supabase.ts
export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true },
  realtime: { eventsPerSecond: 10 }
})
```

**Ruolo**: Fornisce il client Supabase configurato, utilities generiche.

#### 2. **services/** - API Calls Pure

```typescript
// services/supabase/documentsService.ts
export const fetchDocuments = async (clientId: string) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('platform_client_id', clientId)

  if (error) throw error
  return data
}
```

**Ruolo**: Solo chiamate API, nessun stato React. Funzioni async pure.

#### 3. **hooks/** - Business Logic + Stato

```typescript
// hooks/useDocuments.ts
export const useDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { clientData } = useAuth()

  useEffect(() => {
    const loadDocs = async () => {
      const data = await fetchDocuments(clientData.id) // ← Service
      setDocuments(data)
      setIsLoading(false)
    }
    loadDocs()
  }, [clientData])

  const uploadDocument = async (file) => {
    // Logica upload + aggiorna stato
  }

  return { documents, isLoading, uploadDocument }
}
```

**Ruolo**: Gestisce stato React, chiama services, espone dati e funzioni ai components.

#### 4. **pages/** - Orchestrazione

```typescript
// pages/DocumentsPage.tsx
export const DocumentsPage = () => {
  const { documents, uploadDocument } = useDocuments() // ← Hook
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDocs = useMemo(() =>
    documents.filter(d => d.name.includes(searchQuery)),
    [documents, searchQuery]
  )

  return (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <DocumentUpload onUpload={uploadDocument} />
      <DocumentsList documents={filteredDocs} />
    </>
  )
}
```

**Ruolo**: Orchestrazione finale - usa hooks, gestisce filtri UI, renderizza components.

#### 5. **components/** - Rendering Pure

```typescript
// components/documents/DocumentsList.tsx
export const DocumentsList = ({ documents, onDelete }) => {
  return (
    <div className="grid">
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} onDelete={onDelete} />
      ))}
    </div>
  )
}
```

**Ruolo**: Solo rendering, riceve tutto via props.

### Riassunto Responsabilità

| Layer | Responsabilità | React? | API? |
|-------|----------------|---------|------|
| **lib** | Utilities generiche, configurazioni | ❌ | ❌ |
| **services** | Chiamate API/database pure | ❌ | ✅ |
| **hooks** | Business logic + stato React | ✅ | ❌ (usa services) |
| **pages** | Orchestrazione hooks + components | ✅ | ❌ |
| **components** | Rendering UI | ✅ | ❌ |

---

## Deploy su Vercel

### Setup Automatico

1. Pusha codice su GitHub
2. Vai su [vercel.com](https://vercel.com) e importa il repository
3. Configura le variabili d'ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy - Vercel farà build e deploy automaticamente

### Deploy Successivi

Ogni push su `main` triggera un deploy automatico.

**Configurazione già pronta**:
- `vercel.json` - Config routing e headers
- Build command: `npm run build`
- Output directory: `dist`

---

## Sicurezza

### Database (Row Level Security)

Tutte le tabelle hanno RLS abilitato:
- **platform_clients**: Utenti vedono solo il proprio profilo
- **conversations**: Accesso solo alle proprie conversazioni
- **messages**: Accesso solo ai messaggi delle proprie conversazioni
- **social_contacts**: Accesso solo ai propri contatti
- **documents**: Accesso solo ai propri documenti

### Token OAuth

Token WhatsApp/Instagram/Messenger:
- Criptati con **Supabase Vault** (pgsodium)
- Mai esposti in plain text
- Gestiti tramite `lib/tokenManager.ts`

### Frontend

- Input sanitizzati (ReDoS prevention, XSS protection)
- Validazione email/form
- No console logs in produzione
- File upload validati (tipo e dimensione)

### Utilities Sicurezza

```typescript
// lib/security-utils.ts
escapeRegex(userInput)   // Previene ReDoS attacks
sanitizeHtml(input)      // Previene XSS
isValidEmail(email)      // Valida formato email
```

---

## Features Principali

### Dashboard
- Overview conversazioni attive
- Statistiche messaggi
- Quick actions

### Inbox Multi-Canale
- Conversazioni unificate WhatsApp/Instagram/Messenger
- Real-time message updates
- Search e filtri per data
- Dettagli lead con storico

### Documenti
- Upload multipli
- Filtri per tipo (PDF, Word, Excel, etc.)
- Download e preview
- Selezione multipla per azioni bulk

### Contatti
- Database centralizzato
- Storico conversazioni
- Search e filtri
- Export dati

---

## Troubleshooting

### Build Errors

```bash
# Pulisci cache e reinstalla
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Supabase Connection

Verifica in `.env`:
- URL corretto (deve iniziare con `https://`)
- ANON_KEY corretto (copiato da Supabase Dashboard)

### TypeScript Errors

```bash
# Rigenera types da Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

---

## Contribuire

1. Fork il progetto
2. Crea branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

---

## Supporto

Per bug o domande, apri una issue su GitHub.

## License

Proprietario - Antonio Tech Dev
