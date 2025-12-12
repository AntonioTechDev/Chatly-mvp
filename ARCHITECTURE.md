# Architettura Chatly MVP

## Struttura Progetto

```
src/
├── components/         # UI Components
│   ├── ui/            # Componenti base riutilizzabili
│   ├── chat/          # Componenti chat (conversazioni, messaggi)
│   ├── documents/     # Componenti documenti
│   ├── contacts/      # Componenti contatti
│   └── layout/        # Layout condivisi (sidebar, header)
├── contexts/          # React Context (stato globale)
├── hooks/             # Custom hooks (business logic)
├── lib/               # Utilities e configurazioni
├── pages/             # Pagine applicazione
├── services/          # Servizi API esterni
└── types/             # TypeScript definitions
```

## Pattern Architetturale

Il progetto segue il pattern **Hooks → Components → Pages**:

### 1. Hooks (Business Logic)

I custom hooks gestiscono:
- Fetch dati da Supabase
- Stato locale (pagination, filters)
- Real-time subscriptions
- CRUD operations

**Esempio**: `useDocuments()`
```tsx
export const useDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch, subscribe, CRUD operations

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    downloadDocument
  }
}
```

### 2. Components (Presentational)

I componenti ricevono dati via props e gestiscono solo il rendering.

**Categorizzazione**:

#### a) UI Components (`ui/`)
Componenti base riutilizzabili senza business logic.

Esempi:
- `Card` - Container generico
- `Button` - Bottone stilizzato
- `SearchBar` - Input di ricerca
- `Badge` - Tag/label
- `Pagination` - Controlli paginazione

#### b) Domain Components (`chat/`, `documents/`, `contacts/`)
Componenti specifici per un dominio, composti da UI components.

Esempi:
- `chat/ConversationCard` - Singola conversazione
- `chat/MessageCard` - Singolo messaggio
- `documents/DocumentCard` - Singolo documento

### 3. Pages (Orchestration)

Le pagine orchestrano hooks e components.

**Responsabilità**:
- Chiamare hooks per ottenere dati
- Gestire stato locale (filtri, ricerca, pagination)
- Passare dati ai components
- Gestire loading/error states

**Esempio**: `DocumentsPage`
```tsx
function DocumentsPage() {
  // 1. Hook per dati
  const { documents, deleteDocument } = useDocuments()

  // 2. Stato filtri
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  // 3. Logica filtri
  const filteredDocuments = useMemo(() => {
    return documents
      .filter(d => d.file_name.includes(searchQuery))
      .filter(d => selectedFilter === 'all' || d.type === selectedFilter)
  }, [documents, searchQuery, selectedFilter])

  // 4. Rendering
  return (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <FilterButtons selected={selectedFilter} onSelect={setSelectedFilter} />
      <DocumentsList documents={filteredDocuments} onDelete={deleteDocument} />
    </>
  )
}
```

## Flusso Dati

```
User Action
    ↓
Page (handler)
    ↓
Hook (API call)
    ↓
Supabase
    ↓
Hook (update state)
    ↓
Page (re-render)
    ↓
Components (ricevono nuovi props)
```

## Regole da Seguire

### ✅ DO

- **Hooks**: Tutta la business logic e chiamate API
- **Components**: Solo rendering, zero business logic
- **Pages**: Orchestrazione di hooks e components
- **Props drilling**: Passa dati dall'alto verso il basso
- **Naming**: Usa nomi descrittivi (`useDocuments`, `DocumentCard`)

### ❌ DON'T

- Non chiamare Supabase direttamente nei components
- Non mettere business logic nei components UI
- Non creare hook dentro components
- Non duplicare logica tra pages
- Non usare prop drilling eccessivo (usa Context se necessario)

## Esempi Pratici

### Creare un nuovo componente UI

```tsx
// src/components/ui/Alert/Alert.tsx
interface AlertProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && <button onClick={onClose}>×</button>}
    </div>
  )
}
```

### Creare un nuovo hook

```tsx
// src/hooks/useContacts.ts
export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*')
    setContacts(data || [])
    setIsLoading(false)
  }

  return { contacts, isLoading, refreshContacts: fetchContacts }
}
```

### Creare una nuova page

```tsx
// src/pages/ContactsPage.tsx
export const ContactsPage: React.FC = () => {
  const { contacts, isLoading } = useContacts()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = useMemo(() =>
    contacts.filter(c => c.name.includes(searchQuery)),
    [contacts, searchQuery]
  )

  if (isLoading) return <Spinner />

  return (
    <div>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <ContactsList contacts={filteredContacts} />
    </div>
  )
}
```

## Styling

- **CSS Modules** con nesting per components specifici
- **Tailwind** per utility classes e layout
- File CSS nella stessa cartella del component

```
ConversationCard/
├── ConversationCard.tsx
├── ConversationCard.css
└── index.ts
```

## State Management

- **Local state**: `useState` per UI state semplice
- **Context**: `AuthContext` per stato globale (user, session)
- **Hooks**: Custom hooks per business logic e data fetching
- **Props**: Passare dati tra componenti

## Performance

- `useMemo` per calcoli costosi (filtri, sorting)
- `useCallback` per funzioni passate come props
- `React.memo` per componenti che renderizzano spesso
- Lazy loading per route (`React.lazy`)

## Testing (Future)

- **Unit tests**: Hooks e utilities
- **Integration tests**: Pages
- **E2E tests**: User flows critici

## Riferimenti

- [React Hooks](https://react.dev/reference/react)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
