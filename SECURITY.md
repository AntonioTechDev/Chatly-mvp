# Sicurezza

Questo documento descrive le misure di sicurezza implementate nel progetto.

## Autenticazione

- **Supabase Auth** - Gestione utenti e sessioni
- **PKCE flow** - Per app Single Page (più sicuro)
- **Auto-refresh tokens** - Rinnovo automatico sessione
- **Session storage** - Persistenza sicura in localStorage

## Database Security

### Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato con policies appropriate:

**Tabelle protette**:
- `platform_clients` - Utenti possono vedere/modificare solo il proprio profilo
- `conversations` - Accesso solo alle proprie conversazioni
- `messages` - Accesso solo ai messaggi delle proprie conversazioni
- `social_contacts` - Accesso solo ai propri contatti
- `documents` - Accesso solo ai propri documenti

**Policies implementate**:
- SELECT - Lettura solo dati propri
- INSERT - Creazione solo con proprio user_id
- UPDATE - Modifica solo dati propri
- DELETE - Eliminazione solo dati propri

### Token Encryption

Token OAuth (WhatsApp, Instagram, Messenger) sono:
- Criptati con **Supabase Vault** (pgsodium)
- Mai esposti in plain text nel database
- Gestiti tramite `lib/tokenManager.ts`

## Frontend Security

### Input Validation

- **Email validation** - Formato corretto
- **RegEx escaping** - Prevenzione ReDoS attacks
- **HTML sanitization** - Prevenzione XSS (layer extra a React)

Utilities in `lib/security-utils.ts`:
```typescript
escapeRegex(userInput)    // Previene ReDoS
sanitizeHtml(input)       // Previene XSS
isValidEmail(email)       // Valida formato
```

### Console Logs

- Production: Zero logs sensibili
- Development: Logs condizionati con `import.meta.env.DEV`
- Nessun token, ID utente, o dato sensibile esposto

### File Upload

- Validazione MIME type
- Limite dimensione file
- Storage separato per client
- Path sanitizzati

## Environment Variables

Variabili sensibili mai committate in git:

```env
VITE_SUPABASE_URL          # Public
VITE_SUPABASE_ANON_KEY     # Public (protetto da RLS)
```

**Nota**: `ANON_KEY` è sicuro esporre perché:
- RLS policies proteggono i dati
- Limitato a operazioni authenticated
- Cannot bypass user-level security

## Best Practices Implementate

### Code Level

- TypeScript strict mode
- No `any` types per dati sensibili
- Props validation con interfaces
- Error boundaries per isolamento errori

### API Calls

- Sempre via hooks custom
- Error handling centralizzato
- Timeout configurabili
- Retry logic per network errors

### Storage

- Documents in Supabase Storage con RLS
- Path structure: `{client_id}/{document_id}/filename`
- Signed URLs per download temporanei

## Vulnerabilità Risolte

### Dicembre 2024

1. ✅ **RLS disabilitato su platform_clients** - Abilitato
2. ✅ **Mancanza policies WRITE** - Aggiunte tutte le policies
3. ✅ **Console logs in production** - Condizionati con env check
4. ✅ **ReDoS vulnerability** - Input sanitizzati con escapeRegex

## Checklist Sicurezza (Per Nuove Features)

Quando aggiungi una feature:

- [ ] RLS policies configurate per nuove tabelle
- [ ] Input validati prima di invio a database
- [ ] No console.log di dati sensibili
- [ ] Error messages non espongono dettagli interni
- [ ] File uploads validati (tipo e dimensione)
- [ ] Types TypeScript per tutti i parametri
- [ ] Test con utente non-autenticato

## Reporting Vulnerabilità

Se trovi una vulnerabilità:

1. **NON** aprire una issue pubblica
2. Contatta il team via email privata
3. Fornisci dettagli del problema
4. Attendi risposta prima di divulgare

## Audit

Ultimo audit: Dicembre 2024
Prossimo audit: Da schedulare

## Riferimenti

- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security](https://react.dev/learn/writing-markup-with-jsx#jsx-prevents-injection-attacks)
