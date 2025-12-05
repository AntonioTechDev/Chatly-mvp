# Database Schema - Chatly MVP

## Overview
Questo documento descrive lo schema completo del database Supabase per Chatly MVP, una piattaforma di gestione conversazioni multi-canale (WhatsApp, Instagram, Messenger).

## Extensions Installate
- `pgcrypto` (1.3) - Funzioni crittografiche
- `uuid-ossp` (1.1) - Generazione UUID
- `vector` (0.8.0) - Supporto embeddings vettoriali per AI/RAG
- `pg_graphql` (1.5.11) - GraphQL support
- `supabase_vault` (0.3.1) - Gestione secrets
- `pg_stat_statements` (1.11) - Statistiche query

---

## Tabelle Principali

### 1. `platform_clients`
**Descrizione**: Clienti business che utilizzano la piattaforma per gestire le proprie conversazioni social.

**Righe attuali**: 1
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco cliente |
| `business_name` | text | NO | - | - | Nome business |
| `email` | text | NO | - | UNIQUE | Email cliente |
| `phone` | text | YES | - | - | Telefono |
| `subscription_plan` | text | YES | - | - | Piano sottoscrizione (deprecato) |
| `status` | text | YES | 'active' | - | Stato cliente |
| `whatsapp_phone_id` | text | YES | - | - | ID telefono WhatsApp Business |
| `whatsapp_token` | text | YES | - | - | Token API WhatsApp |
| `instagram_account_id` | text | YES | - | - | ID account Instagram |
| `instagram_token` | text | YES | - | - | Token API Instagram |
| `messenger_page_id` | text | YES | - | - | ID pagina Messenger |
| `messenger_token` | text | YES | - | - | Token API Messenger |
| `plan_id` | bigint | YES | - | FK → plans.id | ID piano sottoscrizione |
| `created_at` | timestamptz | YES | now() | - | Data creazione |
| `updated_at` | timestamptz | YES | now() | - | Data ultimo aggiornamento |

#### Relazioni
- **FK**: `plan_id` → `plans.id`
- **Referenced by**:
  - `documents.platform_client_id`
  - `conversations.platform_client_id`
  - `social_contacts.platform_client_id`
  - `appointments.platform_client_id`

---

### 2. `social_contacts`
**Descrizione**: Contatti provenienti dai vari canali social (lead/clienti). Include dati di qualificazione e profilazione.

**Righe attuali**: 1
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco contatto |
| `platform_client_id` | bigint | NO | - | FK | Riferimento al cliente della piattaforma |
| `platform` | text | NO | - | - | Piattaforma origine (whatsapp/instagram/messenger) |
| `platform_user_id` | text | NO | - | - | ID utente sulla piattaforma social |
| `display_name` | text | YES | - | - | Nome visualizzato |
| `name` | text | YES | - | - | Nome |
| `surname` | text | YES | - | - | Cognome |
| `email` | text | YES | - | - | Email |
| `phone` | text | YES | - | - | Telefono |
| `company` | text | YES | - | - | Azienda |
| `age` | integer | YES | - | - | Età |
| `volume` | integer | YES | - | - | Volume richiesta |
| `plan_suggested` | text | YES | - | - | Piano suggerito |
| `qualification_status` | text | YES | 'new' | - | Stato qualificazione (new/qualified/unqualified) |
| `data_completeness` | integer | YES | 0 | - | Percentuale completezza dati (0-100) |
| `profile_data` | jsonb | YES | '{}' | - | Dati profilo aggiuntivi |
| `first_contact` | timestamptz | YES | now() | - | Data primo contatto |
| `last_interaction` | timestamptz | YES | now() | - | Data ultima interazione |
| `lead_source` | text | YES | - | - | Fonte lead |
| `lead_score` | integer | YES | - | - | Punteggio lead |
| `goal` | jsonb | YES | - | CHECK: array | Obiettivi (array JSON) |

#### Relazioni
- **FK**: `platform_client_id` → `platform_clients.id`
- **Referenced by**:
  - `messages.social_contact_id`
  - `conversations.social_contact_id`
  - `appointments.social_contact_id`

---

### 3. `conversations`
**Descrizione**: Conversazioni tra platform_clients e social_contacts. Traccia il ciclo di vita delle chat.

**Righe attuali**: 1
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco conversazione |
| `social_contact_id` | bigint | NO | - | FK | Riferimento al contatto social |
| `platform_client_id` | bigint | NO | - | FK | Riferimento al cliente piattaforma |
| `channel` | text | YES | - | - | Canale conversazione (whatsapp/instagram/messenger) |
| `status` | text | YES | - | - | Stato conversazione (open/closed/archived) |
| `started_at` | timestamptz | NO | now() | - | Data inizio |
| `closed_at` | timestamptz | YES | - | - | Data chiusura |

#### Relazioni
- **FK**:
  - `social_contact_id` → `social_contacts.id`
  - `platform_client_id` → `platform_clients.id`
- **Referenced by**: `messages.conversation_id`

---

### 4. `messages`
**Descrizione**: Messaggi scambiati nelle conversazioni. Supporta testo, media e metadati.

**Righe attuali**: 12
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco messaggio |
| `social_contact_id` | bigint | NO | - | FK | Riferimento al contatto |
| `conversation_id` | bigint | YES | - | FK | Riferimento alla conversazione |
| `direction` | text | NO | - | FK → message_directions | Direzione (inbound/outbound) |
| `sender_type` | text | YES | - | FK → sender_types | Tipo mittente (human/bot/system) |
| `message_type` | text | YES | 'text' | FK → message_types | Tipo messaggio (text/image/video/etc) |
| `content_text` | text | YES | - | - | Contenuto testuale |
| `content_media` | jsonb | YES | - | - | Dati media (URL, metadata) |
| `platform_message_id` | text | YES | - | - | ID messaggio sulla piattaforma originale |
| `created_at` | timestamptz | YES | now() | - | Data creazione |

#### Relazioni
- **FK**:
  - `social_contact_id` → `social_contacts.id`
  - `conversation_id` → `conversations.id`
  - `direction` → `message_directions.code`
  - `sender_type` → `sender_types.code`
  - `message_type` → `message_types.code`

---

### 5. `appointments`
**Descrizione**: Appuntamenti schedulati con i contatti social.

**Righe attuali**: 0
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco appuntamento |
| `platform_client_id` | bigint | NO | - | FK | Riferimento al cliente piattaforma |
| `social_contact_id` | bigint | NO | - | FK | Riferimento al contatto |
| `scheduled_for` | timestamptz | NO | - | - | Data/ora appuntamento |
| `status` | text | NO | 'pending' | - | Stato (pending/confirmed/completed/cancelled) |
| `notes` | text | YES | - | - | Note appuntamento |
| `created_at` | timestamptz | NO | now() | - | Data creazione |
| `updated_at` | timestamptz | NO | now() | - | Data aggiornamento |

#### Relazioni
- **FK**:
  - `platform_client_id` → `platform_clients.id`
  - `social_contact_id` → `social_contacts.id`

---

### 6. `documents`
**Descrizione**: Documenti con embeddings vettoriali per RAG (Retrieval Augmented Generation) e AI.

**Righe attuali**: 4
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco documento |
| `content` | text | YES | - | - | Contenuto documento |
| `metadata` | jsonb | YES | - | - | Metadati aggiuntivi |
| `embedding` | vector | YES | - | - | Embedding vettoriale (pgvector) |
| `platform_client_id` | bigint | YES | - | FK | Riferimento al cliente |

#### Relazioni
- **FK**: `platform_client_id` → `platform_clients.id`

**Nota**: Utilizza l'extension `vector` per similarity search e RAG.

---

### 7. `plans`
**Descrizione**: Piani di sottoscrizione con features e limiti.

**Righe attuali**: 0
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Vincoli | Descrizione |
|------|------|----------|---------|---------|-------------|
| `id` | bigint | NO | nextval() | PK | ID univoco piano |
| `name` | text | NO | - | UNIQUE | Nome piano |
| `max_contacts` | integer | YES | - | - | Limite contatti |
| `max_messages_per_month` | integer | YES | - | - | Limite messaggi/mese |
| `support_level` | text | YES | - | - | Livello supporto |
| `price_monthly` | numeric | YES | - | - | Prezzo mensile |
| `features` | jsonb | YES | '{}' | - | Features attive (JSON) |

#### Relazioni
- **Referenced by**: `platform_clients.plan_id`

---

## Tabelle di Supporto

### 8. `n8n_chat_histories`
**Descrizione**: Storico conversazioni per integrazione n8n (workflow automation).

**Righe attuali**: 12
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Nullable | Default | Descrizione |
|------|------|----------|---------|-------------|
| `id` | integer | NO | nextval() | PK |
| `session_id` | varchar | NO | - | ID sessione |
| `message` | jsonb | NO | - | Contenuto messaggio |
| `created_at` | timestamptz | YES | now() | Data creazione |

---

## Tabelle di Lookup (Codici/Enumerazioni)

### 9. `message_types`
**Descrizione**: Tipi di messaggio supportati.

**Righe attuali**: 8
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `code` | text | - | PK - Codice tipo |
| `display_name` | text | - | Nome visualizzato |
| `is_media` | boolean | false | Flag tipo media |
| `is_system` | boolean | false | Flag messaggio sistema |
| `created_at` | timestamptz | now() | Data creazione |

**Valori previsti**: text, image, video, audio, document, location, contact, sticker

---

### 10. `message_directions`
**Descrizione**: Direzioni dei messaggi.

**Righe attuali**: 4
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `code` | text | - | PK - Codice direzione |
| `display_name` | text | - | Nome visualizzato |
| `is_inbound` | boolean | false | Flag messaggio in entrata |
| `created_at` | timestamptz | now() | Data creazione |

**Valori previsti**: inbound, outbound, internal, system

---

### 11. `sender_types`
**Descrizione**: Tipologie di mittenti.

**Righe attuali**: 5
**RLS**: ✅ Abilitato

#### Colonne
| Nome | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `code` | text | - | PK - Codice tipo mittente |
| `display_name` | text | - | Nome visualizzato |
| `is_human` | boolean | false | Flag umano |
| `is_bot` | boolean | false | Flag bot |
| `is_system` | boolean | false | Flag sistema |
| `created_at` | timestamptz | now() | Data creazione |

**Valori previsti**: user, agent, bot, system, ai_assistant

---

## Diagramma ER (Relazioni)

```
platform_clients (1) ──┬─→ (N) conversations
                       ├─→ (N) social_contacts
                       ├─→ (N) documents
                       └─→ (N) appointments

plans (1) ──→ (N) platform_clients

social_contacts (1) ──┬─→ (N) messages
                      ├─→ (N) conversations
                      └─→ (N) appointments

conversations (1) ──→ (N) messages

message_types (1) ──→ (N) messages
message_directions (1) ──→ (N) messages
sender_types (1) ──→ (N) messages
```

---

## Indici Consigliati

```sql
-- Performance query su messaggi
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_social_contact_id ON messages(social_contact_id);

-- Performance query su conversazioni
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_platform_client_id ON conversations(platform_client_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);

-- Performance query su contatti
CREATE INDEX idx_social_contacts_platform_client_id ON social_contacts(platform_client_id);
CREATE INDEX idx_social_contacts_qualification_status ON social_contacts(qualification_status);
CREATE INDEX idx_social_contacts_last_interaction ON social_contacts(last_interaction DESC);

-- Ricerca vettoriale su documents
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
```

---

## Row Level Security (RLS)

⚠️ **IMPORTANTE**: Tutte le tabelle hanno RLS abilitato. È necessario configurare le policy per ogni tabella.

### Policy consigliate

```sql
-- Example: platform_clients possono vedere solo i propri dati
CREATE POLICY "Users can view own data" ON platform_clients
  FOR SELECT USING (auth.uid() = id);

-- Example: platform_clients possono vedere solo i propri social_contacts
CREATE POLICY "Clients can view own contacts" ON social_contacts
  FOR SELECT USING (
    platform_client_id IN (
      SELECT id FROM platform_clients WHERE auth.uid() = id
    )
  );
```

---

## Note Tecniche

### Embeddings e AI
- La tabella `documents` utilizza pgvector per gestire embeddings
- Supporta similarity search per RAG (Retrieval Augmented Generation)
- Utilizzare `vector_cosine_ops` per indice IVFFLAT

### Integrazioni Social
- Supporto multi-canale: WhatsApp Business API, Instagram API, Messenger API
- Token e credenziali salvati in `platform_clients`
- ID piattaforma originali salvati in `platform_message_id` e `platform_user_id`

### Qualificazione Lead
- Sistema di scoring: `lead_score`, `lead_source`
- Tracking completezza dati: `data_completeness` (0-100%)
- Stati qualificazione: new, qualified, unqualified
- Goal tracking con JSONB array

### Automazione
- Integrazione n8n tramite `n8n_chat_histories`
- Supporto per bot e AI assistant tramite `sender_types`

---

## TODO / Miglioramenti Futuri

- [ ] Aggiungere tabella `tags` per etichettare conversazioni e contatti
- [ ] Implementare tabella `templates` per messaggi predefiniti
- [ ] Aggiungere `webhooks` table per eventi in uscita
- [ ] Sistema di notifiche interne
- [ ] Analytics aggregati in tabelle dedicate
- [ ] Audit log per tracciare modifiche critiche

---

**Ultimo aggiornamento**: 2025-12-05
**Versione Schema**: 1.0.0
