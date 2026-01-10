# Chatly MVP - LLM Context Document

## Project Overview

Chatly MVP is a multi-channel conversation management platform that unifies customer communications from WhatsApp, Instagram, and Messenger into a single interface. The application enables businesses to manage all social media conversations, contacts, and documents in one centralized dashboard with real-time updates.

**Core Value Proposition**: Eliminate channel-switching chaos by providing a unified inbox where business operators can view, respond to, and track all customer conversations across multiple platforms in real-time.

**Data Flow Architecture**: Chatly is a read-heavy application. Incoming messages from WhatsApp/Instagram/Messenger are captured by **n8n workflows** (external automation platform), which write data to the Supabase database. The Chatly frontend reads this data via Supabase client and displays conversations in real-time. Outgoing messages from human operators are sent via n8n webhooks to the respective platforms.

## Technology Stack

- **Frontend**: React 18.3, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL 15, Auth, Realtime, Storage, Vault)
- **Routing**: React Router 6.26
- **State Management**: React Context API (AuthContext for global auth state)
- **External Integration**: n8n webhooks for sending messages to social platforms
- **Deployment**: Vercel (frontend), Supabase Cloud (backend)
- **Libraries**: react-hot-toast (notifications), recharts (dashboard charts), jspdf (PDF export)

## Architecture Overview

### Layered Architecture Pattern

The codebase follows a strict **layered architecture** with clear separation of concerns:

```
User Interaction
    ↓
Pages (Orchestration layer - combines hooks and components)
    ↓
Hooks (Business logic + React state management)
    ↓
Services (Pure API calls - no React dependencies)
    ↓
Lib (Utilities, Supabase client configuration)
    ↓
Supabase (Database, Auth, Storage, Realtime)
```

**Key Principle**: Each layer only communicates with the layer directly below it. Services never import hooks. Hooks never manipulate DOM. Pages orchestrate but don't contain business logic.

### Directory Structure

```
src/
├── components/          # Presentation components (organized by domain)
│   ├── ui/             # Generic reusable components (Button, Card, Badge, SearchBar, etc.)
│   ├── chat/           # Chat-specific components (ConversationCard, MessageCard, ChatArea, etc.)
│   ├── contacts/       # Contact management components
│   ├── documents/      # Document management components
│   └── layout/         # Layout components (MainSidebar, ProtectedRoute, LeadDetailsPanel)
│
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Global authentication state (user, session, clientData)
│
├── hooks/              # Custom hooks with business logic
│   ├── useConversations.ts  # Manages conversation fetching, filtering, realtime subscriptions
│   ├── useMessages.ts       # Manages messages for a conversation
│   ├── useContacts.ts       # Manages social contacts CRUD operations
│   └── useDocuments.ts      # Manages document upload/download/delete
│
├── lib/                # Utilities and configuration
│   ├── supabase.ts          # Supabase client singleton instance
│   ├── security-utils.ts    # Security helpers (escapeRegex, sanitizeHtml, isValidEmail, etc.)
│   └── tokenManager.ts      # Secure token management via Supabase Vault
│
├── services/           # API call services (pure functions, no state)
│   ├── conversationService.ts  # CRUD and realtime subscriptions for conversations
│   ├── messageService.ts       # Message fetching, sending, realtime subscriptions
│   ├── contactService.ts       # Contact CRUD operations
│   └── supabase/
│       ├── documentsService.ts # Document metadata operations
│       └── storageService.ts   # Supabase Storage operations (upload/download/delete files)
│
├── pages/              # Route pages (orchestrate hooks and components)
│   ├── LoginPage.tsx        # Authentication page
│   ├── DashboardPage.tsx    # Overview dashboard with statistics
│   ├── InboxPage.tsx        # Multi-channel conversation view (main page)
│   ├── ContactsPage.tsx     # Contact management
│   ├── DocumentsPage.tsx    # Document management
│   ├── UserInfoPage.tsx     # Platform client profile
│   └── LogActivityPage.tsx  # Activity logs
│
├── types/              # TypeScript type definitions
│   ├── database.types.ts    # Auto-generated from Supabase schema
│   └── auth.types.ts        # Authentication-related types
│
├── App.tsx             # Root component with routing
└── main.tsx            # Application entry point
```

## Database Schema

### Core Tables

#### `platform_clients`
**Purpose**: Business accounts using Chatly to manage their social media conversations.

**Key Fields**:
- `id`: Primary key
- `user_id`: Foreign key to `auth.users` (Supabase Auth)
- `business_name`, `email`, `phone`: Business contact information
- `whatsapp_phone_id`, `instagram_account_id`, `messenger_page_id`: Platform identifiers
- `whatsapp_token_secret_id`, `instagram_token_secret_id`, `messenger_token_secret_id`: References to encrypted tokens in Supabase Vault (UUID)
- `plan_id`: Foreign key to `plans` table

**RLS**: Enabled. Users can only view/update their own profile via `user_id = auth.uid()`.

**Critical Note**: OAuth tokens are NOT stored in plain text. Token secret IDs reference encrypted values in Supabase Vault. Use `lib/tokenManager.ts` functions to manage tokens securely.

#### `social_contacts`
**Purpose**: End-user contacts from social platforms (leads/customers).

**Key Fields**:
- `id`: Primary key
- `platform_client_id`: Foreign key to `platform_clients`
- `platform`: Channel origin ('whatsapp', 'instagram', 'messenger')
- `platform_user_id`: User ID on the social platform (e.g., WhatsApp phone number, Instagram PSID)
- `display_name`, `name`, `surname`, `email`, `phone`: Contact details
- `company`, `age`, `volume`, `plan_suggested`: Lead qualification data
- `qualification_status`: 'new', 'qualified', 'unqualified'
- `data_completeness`: Integer 0-100 representing profile completion
- `profile_data`: JSONB for additional structured data
- `first_contact`, `last_interaction`: Timestamp tracking
- `lead_source`, `lead_score`: Lead management fields
- `goal`: JSONB array of contact objectives

**RLS**: Enabled. Users can only access contacts belonging to their `platform_client_id`.

**Linking**: Contacts can be linked via `master_contact_id` to consolidate duplicate profiles across channels.

#### `conversations`
**Purpose**: Chat sessions between a platform client and a social contact.

**Key Fields**:
- `id`: Primary key
- `social_contact_id`: Foreign key to `social_contacts`
- `platform_client_id`: Foreign key to `platform_clients`
- `channel`: 'whatsapp', 'instagram', or 'messenger'
- `status`: 'open', 'closed', 'archived'
- `started_at`, `closed_at`: Conversation lifecycle timestamps

**RLS**: Enabled. Users can only access conversations where `platform_client_id` matches their profile.

**Realtime**: Subscriptions enabled for INSERT/UPDATE events on conversations filtered by `channel`.

#### `messages`
**Purpose**: Individual messages within conversations.

**Key Fields**:
- `id`: Primary key
- `conversation_id`: Foreign key to `conversations`
- `social_contact_id`: Foreign key to `social_contacts`
- `direction`: 'inbound' (from customer) or 'outbound' (to customer) - foreign key to `message_directions`
- `sender_type`: 'human_agent', 'ai', 'bot', 'system' - foreign key to `sender_types`
- `message_type`: 'text', 'image', 'video', 'audio', 'document', 'sticker' - foreign key to `message_types`
- `content_text`: Message text content
- `content_media`: JSONB with media metadata (URL, mime type, etc.)
- `platform_message_id`: Original message ID from social platform
- `created_at`: Timestamp

**RLS**: Enabled. Users can only access messages from conversations they own.

**Realtime**: Subscriptions enabled for INSERT/UPDATE events on messages filtered by `conversation_id`.

#### `documents`
**Purpose**: File uploads associated with platform clients (contracts, PDFs, images, etc.).

**Key Fields**:
- `id`: Primary key
- `platform_client_id`: Foreign key to `platform_clients`
- `file_name`, `file_size`, `mime_type`: File metadata
- `storage_path`: Path in Supabase Storage bucket
- `drive_file_id`, `drive_web_view_link`: Optional Google Drive integration fields
- `uploaded_at`: Upload timestamp
- `content`, `metadata`, `embedding`: Optional fields for AI/RAG features (vector embeddings)

**RLS**: Enabled. Users can only access documents they uploaded.

**Storage**: Files are stored in Supabase Storage bucket `documents/`. Use `services/supabase/storageService.ts` for file operations.

#### `appointments`
**Purpose**: Scheduled appointments with social contacts.

**Key Fields**:
- `id`: Primary key
- `platform_client_id`: Foreign key to `platform_clients`
- `social_contact_id`: Foreign key to `social_contacts`
- `scheduled_for`: Appointment datetime
- `status`: 'pending', 'confirmed', 'completed', 'cancelled'
- `notes`: Free-text notes

**RLS**: Enabled. Users can only manage their own appointments.

### Reference Tables (Lookup/Enum Tables)

- **`message_directions`**: Defines message direction codes ('inbound', 'outbound')
- **`message_types`**: Defines message types ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact')
- **`sender_types`**: Defines sender types ('human_agent', 'ai', 'bot', 'system')
- **`plans`**: Subscription plans with features and limits

### Security: Row Level Security (RLS)

**All user-facing tables have RLS enabled**. Policies enforce data isolation based on `auth.uid()` (authenticated user ID).

**Common Policy Pattern**:
```sql
-- Example for conversations
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);
```

**Critical Files**:
- `database/security_fixes.sql`: Contains all RLS policy definitions
- `database/db.sql`: Complete schema with constraints and indexes

## Backend Services

### Supabase Client Configuration

**File**: `src/lib/supabase.ts`

The Supabase client is configured as a singleton with:
- Auto-refresh tokens for seamless session management
- Realtime events throttled to 10 events/second
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Service Layer Pattern

**Purpose**: Services contain pure API call functions with no React dependencies. They throw errors on failure; hooks handle error states.

**Naming Convention**: Services use async functions with descriptive names (`getConversations`, `sendMessage`, `uploadDocument`).

**Example Service** (`services/conversationService.ts`):
```typescript
export const getConversations = async (filters: ConversationFilters) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, social_contact:social_contacts(*), platform_client:platform_clients(*)')
    .eq('platform_client_id', filters.platformClientId)
    .eq('channel', filters.channel)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}
```

**Key Services**:
- `conversationService.ts`: Fetch conversations, subscribe to realtime updates, fetch with relations
- `messageService.ts`: Fetch/send messages, subscribe to realtime updates, search messages
- `contactService.ts`: CRUD operations for social contacts, linking contacts
- `documentsService.ts`: Document metadata operations (create, delete, fetch)
- `storageService.ts`: Supabase Storage file operations (upload, download, delete)

### Realtime Subscriptions

Chatly uses **Supabase Realtime** for live updates.

**Pattern**:
1. Service exposes a `subscribe` function that returns a Supabase channel
2. Hook calls the subscribe function in a `useEffect` and unsubscribes on cleanup
3. Callbacks update local state when INSERT/UPDATE events occur

**Example** (`services/conversationService.ts`):
```typescript
export const subscribeToConversations = (channel: string, callbacks: {...}) => {
  const supabaseChannel = supabase
    .channel(`conversations:${channel}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `channel=eq.${channel}` },
        (payload) => callbacks.onInsert?.(payload.new))
    .subscribe()

  return supabaseChannel
}
```

**Cleanup**: Always unsubscribe in `useEffect` cleanup to prevent memory leaks.

### Token Management (Supabase Vault)

**File**: `src/lib/tokenManager.ts`

OAuth tokens for WhatsApp, Instagram, and Messenger are encrypted using **Supabase Vault** (pgsodium).

**Functions**:
- `storePlatformToken(platformClientId, tokenType, tokenValue)`: Encrypt and store a token
- `getPlatformToken(platformClientId, tokenType)`: Decrypt and retrieve a token
- `updatePlatformToken(platformClientId, tokenType, newTokenValue)`: Update an existing token
- `deletePlatformToken(platformClientId, tokenType)`: Permanently delete a token (hard delete)
- `hasToken(platformClientId, tokenType)`: Check if a token exists without retrieving it
- `getConfiguredTokenTypes(platformClientId)`: List all configured platforms

**Token Types**: `'whatsapp' | 'instagram' | 'messenger'`

**Critical**: NEVER store tokens in plain text. Always use `tokenManager.ts` functions. Database stores only `*_token_secret_id` (UUID references to Vault).

### Message Sending (n8n Webhook Integration)

**File**: `src/services/messageService.ts`

Outgoing messages from human operators are sent via **n8n webhooks**, not directly to social platform APIs.

**Function**: `sendHumanOperatorMessage(message, conversationId, socialContact, platformClient)`

**Webhook URLs**:
- **Production**: `https://automagruppoitalia.app.n8n.cloud/webhook/human-operator`
- **Development**: `https://automagruppoitalia.app.n8n.cloud/webhook-test/human-operator`

**Payload Structure**:
```typescript
{
  message: string,
  platform: 'whatsapp' | 'instagram' | 'messenger',
  platform_user_id: string,           // Recipient ID on platform
  platform_client_id: number,
  social_contact_id: number,
  conversation_id: number,
  direction: 'outgoing',
  created_at: ISO timestamp,
  // Platform-specific fields:
  platform_client_whatsapp_phone?: string,  // For WhatsApp
  senderID?: string                          // For Instagram/Messenger (account/page ID)
}
```

**Error Handling**: Throws errors if platform credentials are missing or webhook call fails.

**Environment Detection**: Uses `import.meta.env.MODE` to determine production vs. development.

## Frontend Architecture

### State Management

**Global State**: `AuthContext` (src/contexts/AuthContext.tsx)
- Manages authentication state: `user`, `session`, `clientData`
- Provides: `login()`, `logout()`, `refreshClientData()`, `isAuthenticated`, `isLoading`
- Automatically fetches `platform_clients` data on login/session restore
- Listens to Supabase auth state changes for session refresh

**Local State**: React `useState` in hooks for feature-specific data (conversations, messages, contacts, documents).

**No Redux/Zustand**: The application uses Context API for global auth and custom hooks for feature state. This keeps the architecture simple and avoids over-engineering.

### Custom Hooks Pattern

**Purpose**: Encapsulate business logic, API calls, and React state management. Hooks consume services and expose data + actions to pages/components.

**Naming Convention**: `use[Feature].ts` (e.g., `useConversations`, `useMessages`, `useDocuments`)

**Structure**:
- State declarations (data, loading, error)
- API call functions (using services)
- `useEffect` for initial fetch and realtime subscriptions
- Memoized computed values (filters, sorted data)
- Return object with data and action functions

**Example** (`hooks/useConversations.ts`):
```typescript
export const useConversations = (channel: 'whatsapp' | 'instagram' | 'messenger') => {
  const { clientData } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch initial data
  useEffect(() => { /* fetch conversations */ }, [clientData?.id, channel])

  // Subscribe to realtime updates
  useEffect(() => { /* subscribe to Supabase Realtime */ return () => { /* cleanup */ } }, [channel])

  // Memoized filtering
  const filteredConversations = useMemo(() => { /* filter logic */ }, [conversations, searchQuery])

  return { conversations: filteredConversations, isLoading, handleSearchChange, refetch, ... }
}
```

**Key Hooks**:
- `useConversations(channel)`: Manages conversations for a specific channel with search/date filters
- `useMessages(conversationId)`: Manages messages in a conversation with realtime updates
- `useContacts()`: Manages social contacts CRUD with search/pagination
- `useDocuments()`: Manages document uploads, downloads, and deletion

### Pages (Orchestration Layer)

**Purpose**: Pages compose hooks and components to deliver complete features. They handle UI-level state (filters, modals, tabs) and pass data to presentational components.

**Key Pages**:
- **`LoginPage.tsx`**: Authentication form using `useAuth()` context
- **`DashboardPage.tsx`**: Overview statistics and quick actions
- **`InboxPage.tsx`**: Main conversation view - displays `ConversationsSidebar` + `ChatArea` + `LeadDetailsPanel`
- **`ContactsPage.tsx`**: Contact list with search, pagination, export to PDF
- **`DocumentsPage.tsx`**: Document grid/list with upload, download, delete, type filters
- **`UserInfoPage.tsx`**: Platform client profile view/edit
- **`LogActivityPage.tsx`**: Activity logs (placeholder for future implementation)

**InboxPage Architecture** (Most Complex Page):
```typescript
// InboxPage.tsx
<div className="layout">
  <MainSidebar />  {/* Navigation */}
  <ConversationsSidebar
    conversations={conversations}
    onSelect={setSelectedConversation}
  />
  <ChatArea
    conversation={selectedConversation}
    messages={messages}
    onSendMessage={sendMessage}
  />
  <LeadDetailsPanel contact={selectedConversation?.social_contact} />
</div>
```

### Component Organization

**UI Components** (`components/ui/`):
- Generic, reusable, presentational components
- Examples: `Button`, `Card`, `Badge`, `SearchBar`, `Pagination`, `FilterButtons`, `ViewModeToggle`
- Receive all data via props, no business logic

**Domain Components** (`components/chat/`, `components/contacts/`, `components/documents/`):
- Feature-specific components
- Examples: `ConversationCard`, `MessageCard`, `ContactCard`, `DocumentCard`
- Still presentational but domain-aware (understand message structure, contact fields, etc.)

**Layout Components** (`components/layout/`):
- `MainSidebar`: Navigation sidebar with routes
- `ProtectedRoute`: Route guard checking authentication
- `LeadDetailsPanel`: Sidebar panel showing contact details in InboxPage

### Routing

**File**: `src/App.tsx`

Uses **React Router v6** with `BrowserRouter`.

**Routes**:
- `/login` - Public route (LoginPage)
- `/dashboard` - Protected route (DashboardPage)
- `/inbox` - Protected route (InboxPage)
- `/contacts` - Protected route (ContactsPage)
- `/documents` - Protected route (DocumentsPage)
- `/user-info` - Protected route (UserInfoPage)
- `/log-activity` - Protected route (LogActivityPage)
- `/` - Redirects to `/dashboard` if authenticated, `/login` otherwise
- `*` - Catch-all redirects to `/`

**ProtectedRoute**: HOC that checks `isAuthenticated` and redirects to `/login` if false.

## Security Considerations

### Input Validation and Sanitization

**File**: `src/lib/security-utils.ts`

**Key Functions**:
- `escapeRegex(string)`: Prevents ReDoS attacks by escaping regex special characters
- `sanitizeHtml(input)`: Extra XSS protection (React already escapes by default)
- `isValidEmail(email)`: Email format validation
- `isValidPhone(phone)`: International phone number validation
- `sanitizeInput(input, maxLength)`: Removes null bytes, trims, truncates
- `debounce(fn, delayMs)`: Rate limiting for search/input handlers

**Best Practice**: Always validate user input before sending to API. Use `sanitizeInput` for text fields, `isValidEmail` for email, `escapeRegex` for search queries.

### Row Level Security (RLS)

All database tables have RLS enabled. Policies ensure users can only access their own data.

**Key Policy Pattern**: Queries check if `platform_client_id` matches a `platform_clients.id` where `user_id = auth.uid()`.

**Critical**: RLS is enforced at the database level, so even if frontend code is compromised, users cannot access other users' data.

### Authentication

**Supabase Auth** handles authentication with email/password.

**Session Management**:
- `AuthContext` checks for existing session on mount
- Auto-refresh tokens prevent session expiration
- `onAuthStateChange` listener handles sign in/out events

**Token Storage**: Supabase stores auth tokens in browser `localStorage` automatically.

### OAuth Token Encryption

**Supabase Vault** (pgsodium) encrypts WhatsApp/Instagram/Messenger tokens.

**Never**:
- Store tokens in plain text
- Log tokens to console in production
- Expose token secret IDs to users

**Always**:
- Use `tokenManager.ts` functions
- Check `hasToken()` before attempting API calls
- Handle token retrieval errors gracefully

### Content Security Policy (CSP)

**File**: `vercel.json`

Security headers configured for Vercel deployment:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Development Patterns

### File Naming Conventions

- **Components**: PascalCase with folder structure (`components/chat/ConversationCard/ConversationCard.tsx`)
- **Hooks**: camelCase (`useConversations.ts`)
- **Services**: camelCase (`conversationService.ts`)
- **Pages**: PascalCase (`DashboardPage.tsx`)
- **Types**: PascalCase (`database.types.ts`)
- **Utils**: camelCase (`security-utils.ts`)

### Import Organization

Order imports as:
1. React imports
2. Third-party libraries
3. Internal hooks/contexts
4. Internal services
5. Internal types
6. Internal components
7. Styles/assets

### Error Handling Pattern

**Services**: Throw errors
```typescript
if (error) throw error
```

**Hooks**: Catch errors and set error state
```typescript
try {
  const data = await fetchConversations(...)
} catch (err: any) {
  setError(err.message)
  toast.error('Error message')
}
```

**Pages/Components**: Display error messages from hooks
```typescript
{error && <div className="error">{error}</div>}
```

### TypeScript Types

**File**: `src/types/database.types.ts` (auto-generated from Supabase schema)

**Helper Types**:
- `Tables<'table_name'>`: Row type for a table
- `TablesInsert<'table_name'>`: Insert type (omits auto-generated fields)
- `TablesUpdate<'table_name'>`: Update type (all fields optional)

**Custom Types**:
- `ConversationWithRelations`: Conversation with joined `social_contact` and `messages[]`
- `MessageWithRelations`: Message with joined `social_contact`
- `SocialContactWithRelations`: Contact with joined `conversations[]`

**Regenerate Types**: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts`

### Console Logging

**Development**: Logs are allowed for debugging
**Production**: No console logs (remove before deployment or use `import.meta.env.DEV` guards)

**Pattern**:
```typescript
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}
```

## Key Integration Points

### n8n Webhook Integration

**Incoming Messages**: n8n workflows capture messages from WhatsApp/Instagram/Messenger APIs and insert into Supabase `messages` table.

**Outgoing Messages**: Frontend calls `sendHumanOperatorMessage()` which posts to n8n webhook. n8n sends message via appropriate platform API.

**Webhook URLs** (hardcoded in `messageService.ts`):
- Production: `https://automagruppoitalia.app.n8n.cloud/webhook/human-operator`
- Development: `https://automagruppoitalia.app.n8n.cloud/webhook-test/human-operator`

### Supabase Storage

**Bucket**: `documents/`

**Path Structure**: `documents/{platformClientId}/{filename}`

**Operations**:
- Upload: `storageService.uploadFile(file, platformClientId)`
- Download: `storageService.getFileUrl(storagePath)`
- Delete: `storageService.deleteFile(storagePath)`

**File Validation**: Frontend validates file type and size before upload (see `DocumentUpload.tsx`).

### Supabase Realtime

**Subscribed Tables**:
- `conversations`: Listen for new conversations and status updates
- `messages`: Listen for new messages in active conversations

**Channel Naming**: `{table}:{filter_value}` (e.g., `messages:123` for conversation ID 123)

**Cleanup**: Always call `channel.unsubscribe()` in `useEffect` cleanup to prevent memory leaks.

## Critical Files Reference

### Configuration
- `package.json`: Dependencies and scripts
- `vite.config.ts`: Vite build configuration
- `tailwind.config.js`: Tailwind CSS theme
- `vercel.json`: Vercel deployment config with security headers
- `.env.example`: Environment variable template

### Database
- `database/db.sql`: Complete schema (tables, constraints, indexes, RLS policies)
- `database/security_fixes.sql`: RLS policy fixes and security enhancements
- `database/generate_test_data.sql`: Test data generator

### Core Application
- `src/main.tsx`: Application entry point
- `src/App.tsx`: Root component with routing
- `src/contexts/AuthContext.tsx`: Global authentication state
- `src/lib/supabase.ts`: Supabase client configuration
- `src/lib/tokenManager.ts`: Secure token management
- `src/lib/security-utils.ts`: Security utility functions

### Services
- `src/services/conversationService.ts`: Conversation API
- `src/services/messageService.ts`: Message API + n8n webhook integration
- `src/services/contactService.ts`: Contact API
- `src/services/supabase/documentsService.ts`: Document metadata API
- `src/services/supabase/storageService.ts`: File storage API

### Hooks
- `src/hooks/useConversations.ts`: Conversation state management
- `src/hooks/useMessages.ts`: Message state management
- `src/hooks/useContacts.ts`: Contact state management
- `src/hooks/useDocuments.ts`: Document state management

### Pages
- `src/pages/LoginPage.tsx`: Authentication
- `src/pages/DashboardPage.tsx`: Overview dashboard
- `src/pages/InboxPage.tsx`: Main conversation interface
- `src/pages/ContactsPage.tsx`: Contact management
- `src/pages/DocumentsPage.tsx`: Document management

### Types
- `src/types/database.types.ts`: Auto-generated Supabase types
- `src/types/auth.types.ts`: Authentication types

## Common Development Tasks

### Adding a New Feature
1. Define database schema changes in `database/` SQL files
2. Regenerate TypeScript types from Supabase schema
3. Create service functions in `src/services/` for API calls
4. Create a custom hook in `src/hooks/` for state management
5. Create UI components in `src/components/`
6. Create or update a page in `src/pages/` to orchestrate the feature
7. Add route in `src/App.tsx` if needed
8. Update RLS policies if new tables are involved

### Working with Messages
1. Use `useMessages(conversationId)` hook in components
2. Subscribe to realtime updates automatically via hook
3. Send messages using `sendHumanOperatorMessage()` from `messageService.ts`
4. Display messages with `MessageCard` component

### Working with Contacts
1. Use `useContacts()` hook for CRUD operations
2. Link duplicate contacts using `linkContactToMaster()` from `contactService.ts`
3. Display contacts with `ContactCard` or `ContactsList` components

### Working with Documents
1. Use `useDocuments()` hook for upload/download/delete
2. Upload files using `uploadDocument(file)` from hook (handles both storage and metadata)
3. Download files using `downloadDocument(document)` from hook
4. Display documents with `DocumentCard` or `DocumentsList` components

### Debugging Realtime Issues
1. Check Supabase Realtime dashboard for connection status
2. Verify RLS policies allow the authenticated user to access the data
3. Ensure channel names match filter values (e.g., `messages:${conversationId}`)
4. Check browser console for subscription errors
5. Verify `unsubscribe()` is called in `useEffect` cleanup

### Handling Authentication Issues
1. Check `AuthContext` state with React DevTools
2. Verify Supabase Auth session in browser DevTools → Application → Local Storage
3. Clear localStorage and re-login if session is corrupted
4. Check RLS policies if data doesn't load after login
5. Ensure `platform_clients.user_id` matches `auth.users.id`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Project Root**: `C:\Users\AntonioDeBiase\Desktop\Progetti\PERSONALI\CHATLY MVP\Chatly-mvp`
