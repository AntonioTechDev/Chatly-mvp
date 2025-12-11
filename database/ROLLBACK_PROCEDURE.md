# Procedura di Rollback - Database Cleanup Chatly

## Indice
1. [Overview](#overview)
2. [Prerequisiti](#prerequisiti)
3. [Procedura Backup](#procedura-backup)
4. [Procedura Cleanup](#procedura-cleanup)
5. [Procedura Rollback](#procedura-rollback)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Questo documento descrive la procedura completa per:
- Eseguire backup del database Supabase
- Eliminare dati di test in sicurezza
- Ripristinare i dati in caso di errori (rollback)

**⚠️ IMPORTANTE**: Non eseguire MAI operazioni di cleanup direttamente in produzione senza aver prima testato su ambiente di staging/copia del database.

---

## Prerequisiti

### Strumenti Necessari
- Accesso Supabase Dashboard (https://supabase.com/dashboard)
- Supabase CLI installato (opzionale ma consigliato)
- Accesso PostgreSQL al database (via Supabase SQL Editor)

### Permessi Richiesti
- Ruolo `postgres` o permessi `DELETE`, `INSERT`, `UPDATE` su tutte le tabelle
- Accesso al pannello di amministrazione Supabase

### File Necessari
- `backup_complete.sql` - Script per backup completo
- `cleanup_test_data.sql` - Script per eliminazione dati test
- `ROLLBACK_PROCEDURE.md` - Questo documento

---

## Procedura Backup

### Metodo 1: Backup tramite Script SQL (Consigliato per Backup Selettivi)

#### Step 1: Eseguire Backup Script
```bash
# Opzione A: Via Supabase SQL Editor
1. Aprire Supabase Dashboard
2. Navigare su SQL Editor
3. Caricare file database/backup_complete.sql
4. Eseguire script
5. Salvare output in file backup_YYYYMMDD_HHMMSS.sql
```

#### Step 2: Salvare Output
L'output conterrà tutte le query `INSERT INTO` per ripristinare i dati. Esempio:
```sql
INSERT INTO social_contacts (id, platform_client_id, platform, ...) VALUES
(77, 1, 'whatsapp', ...),
(86, 1, 'whatsapp', ...);
```

Salvare questo output come:
```
backup_YYYYMMDD_HHMMSS.sql
```

### Metodo 2: Backup Completo via Supabase CLI (Consigliato per Backup Totale)

```bash
# Installare Supabase CLI se non presente
npm install -g supabase

# Login
supabase login

# Dump completo database
supabase db dump --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_full_YYYYMMDD.sql
```

### Metodo 3: Backup Manuale via pg_dump (Massima Affidabilità)

```bash
# Da terminale con pg_dump installato
pg_dump \
  --host=[DB_HOST] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --clean \
  --if-exists \
  --format=plain \
  --file=backup_pgdump_YYYYMMDD.sql
```

**Credenziali database**: Reperibili da Supabase Dashboard > Settings > Database > Connection string

---

## Procedura Cleanup

### Ambiente di Test (OBBLIGATORIO PRIMA)

#### Step 1: Creare Copia Database Test
```bash
# Via Supabase Dashboard
1. Project Settings > Database
2. Creare nuovo progetto di test (se non esiste)
3. Copiare schema e dati produzione su progetto test

# Via CLI
supabase db reset --db-url "[TEST_DB_URL]"
```

#### Step 2: Eseguire Cleanup su Test
```sql
-- Via SQL Editor su progetto TEST
1. Aprire database/cleanup_test_data.sql
2. Eseguire script
3. Verificare output statistiche:
   - CONTATTI TEST IDENTIFICATI
   - STATISTICHE PRE-ELIMINAZIONE
   - STATISTICHE POST-ELIMINAZIONE
```

#### Step 3: Validare Risultati Test
```sql
-- Verificare contatti rimanenti
SELECT id, display_name, email, platform, platform_user_id
FROM social_contacts
ORDER BY id;

-- Verificare integrità referenziale
SELECT
  'conversations' as table_name,
  COUNT(*) as total,
  COUNT(DISTINCT social_contact_id) as unique_contacts
FROM conversations
UNION ALL
SELECT
  'messages',
  COUNT(*),
  COUNT(DISTINCT social_contact_id)
FROM messages;
```

**✅ CRITERI DI SUCCESSO TEST**:
- Solo contatti reali presenti (es: support@fashionstore.it)
- Nessun errore di foreign key
- Statistiche post-eliminazione corrette

### Ambiente di Produzione (Solo dopo test OK)

#### Step 1: Backup Produzione
```bash
# Eseguire backup_complete.sql su database PRODUZIONE
# Salvare output in backup_prod_YYYYMMDD_HHMMSS.sql
```

#### Step 2: Finestra di Manutenzione (Opzionale ma Consigliato)
```sql
-- Opzionale: bloccare scritture durante cleanup
BEGIN;
LOCK TABLE social_contacts, conversations, messages IN ACCESS EXCLUSIVE MODE;
-- Procedere con cleanup
-- COMMIT solo se tutto OK
```

#### Step 3: Eseguire Cleanup Produzione
```sql
-- Via SQL Editor su database PRODUZIONE
1. Aprire database/cleanup_test_data.sql
2. Eseguire script FINO A COMMIT escluso
3. VERIFICARE output statistiche
4. Se OK: eseguire COMMIT
5. Se KO: eseguire ROLLBACK
```

#### Step 4: Verifica Post-Cleanup
```sql
-- Verificare dati critici
SELECT * FROM social_contacts WHERE email = 'support@fashionstore.it';
SELECT COUNT(*) FROM messages WHERE social_contact_id = 77;
SELECT COUNT(*) FROM conversations WHERE social_contact_id = 77;
```

---

## Procedura Rollback

### Scenario 1: Rollback Immediato (Script Non Committato)

Se il cleanup NON è stato committato:
```sql
-- Semplicemente fare rollback
ROLLBACK;

-- Verificare ripristino
SELECT COUNT(*) FROM social_contacts;
```

### Scenario 2: Rollback Post-Commit (Script Già Eseguito)

#### Metodo A: Ripristino Selettivo da Backup SQL

```sql
-- 1. Disabilitare foreign key temporaneamente
SET session_replication_role = 'replica';

-- 2. Ripristinare dati da backup_prod_YYYYMMDD.sql
-- Copiare e incollare tutti gli INSERT INTO dal file backup

-- 3. Esempio ripristino social_contacts
INSERT INTO social_contacts (id, platform_client_id, platform, platform_user_id, ...) VALUES
(86, 1, 'whatsapp', 'test_special_user', ...),
(87, 1, 'instagram', 'test_user_1', ...),
-- ... tutti gli altri record dal backup

-- 4. Ripristinare conversations
INSERT INTO conversations (id, social_contact_id, platform_client_id, ...) VALUES
-- ... dati dal backup

-- 5. Ripristinare messages
INSERT INTO messages (id, social_contact_id, direction, content_text, ...) VALUES
-- ... dati dal backup

-- 6. Ripristinare n8n_chat_histories
INSERT INTO n8n_chat_histories (id, session_id, message, created_at) VALUES
-- ... dati dal backup

-- 7. Riabilitare foreign key
SET session_replication_role = 'origin';

-- 8. Verificare ripristino
SELECT COUNT(*) FROM social_contacts;
SELECT * FROM social_contacts ORDER BY id LIMIT 10;
```

#### Metodo B: Ripristino Totale da pg_dump

```bash
# 1. Droppare database corrente (ATTENZIONE!)
supabase db reset --db-url "[PROD_DB_URL]"

# 2. Ripristinare da dump completo
psql \
  --host=[DB_HOST] \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --file=backup_pgdump_YYYYMMDD.sql
```

#### Metodo C: Point-in-Time Recovery (PITR) via Supabase

Se abilitato PITR su Supabase (piano Pro+):

```bash
# Via Supabase Dashboard
1. Database > Backups
2. Selezionare backup precedente cleanup
3. Restore to point in time
4. Confermare restore
```

### Verifica Post-Rollback

```sql
-- 1. Contare record per tabella
SELECT
  (SELECT COUNT(*) FROM social_contacts) as social_contacts,
  (SELECT COUNT(*) FROM conversations) as conversations,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM n8n_chat_histories) as n8n_histories;

-- 2. Verificare integrità referenziale
SELECT
  m.id,
  m.social_contact_id,
  sc.display_name
FROM messages m
LEFT JOIN social_contacts sc ON m.social_contact_id = sc.id
WHERE sc.id IS NULL
LIMIT 10;
-- DEVE ritornare 0 righe

-- 3. Verificare dati specifici
SELECT * FROM social_contacts WHERE platform_user_id = 'test_special_user';
-- DEVE ritornare record se rollback OK
```

---

## Troubleshooting

### Problema 1: Foreign Key Constraint Error

**Errore**:
```
ERROR: update or delete on table "social_contacts" violates foreign key constraint
```

**Soluzione**:
```sql
-- Verificare ordine eliminazione (deve essere cascade):
-- 1. appointments
-- 2. messages
-- 3. conversations
-- 4. social_contacts

-- Se necessario, disabilitare temporaneamente
SET session_replication_role = 'replica';
-- Eseguire operazioni
SET session_replication_role = 'origin';
```

### Problema 2: Backup File Troppo Grande

**Soluzione**: Usare backup incrementale per tabella

```bash
# Backup singola tabella
supabase db dump --db-url "[URL]" -t social_contacts > backup_social_contacts.sql
supabase db dump --db-url "[URL]" -t messages > backup_messages.sql
supabase db dump --db-url "[URL]" -t conversations > backup_conversations.sql
```

### Problema 3: Timeout durante Cleanup

**Soluzione**: Eseguire cleanup in batch

```sql
-- Invece di eliminare tutto insieme, fare batch
DELETE FROM messages
WHERE social_contact_id IN (
  SELECT id FROM test_social_contacts LIMIT 1000
);
-- Ripetere fino a 0 righe eliminate
```

### Problema 4: Pattern Test Non Correttamente Identificati

**Soluzione**: Validare pattern prima di cleanup

```sql
-- Verificare SEMPRE prima di eliminare
SELECT
  id,
  display_name,
  email,
  platform_user_id,
  CASE
    WHEN email LIKE 'test%@example.com' THEN 'email_test'
    WHEN platform_user_id LIKE 'test_%' THEN 'platform_id_test'
    WHEN display_name ~ '.*\s\d+$' THEN 'display_name_numbered'
    ELSE 'NO_PATTERN_MATCHED'
  END as matched_pattern
FROM social_contacts
WHERE id IN (SELECT id FROM test_social_contacts);

-- Se pattern non corretti, modificare WHERE clause in cleanup_test_data.sql
```

### Problema 5: Sequence Desincronizzate dopo Rollback

**Soluzione**: Reset sequences

```sql
-- Reset ID sequences dopo ripristino
SELECT setval('social_contacts_id_seq', (SELECT MAX(id) FROM social_contacts));
SELECT setval('conversations_id_seq', (SELECT MAX(id) FROM conversations));
SELECT setval('messages_id_seq', (SELECT MAX(id) FROM messages));
SELECT setval('n8n_chat_histories_id_seq', (SELECT MAX(id) FROM n8n_chat_histories));
```

---

## Checklist Operativa

### Pre-Cleanup
- [ ] Backup completo eseguito
- [ ] Backup salvato in location sicura
- [ ] Cleanup testato su ambiente di test
- [ ] Risultati test validati e corretti
- [ ] Team notificato (se applicabile)
- [ ] Finestra di manutenzione pianificata (se applicabile)

### Durante Cleanup
- [ ] Script backup_complete.sql eseguito
- [ ] Output backup salvato
- [ ] Script cleanup_test_data.sql eseguito SENZA COMMIT
- [ ] Statistiche verificate
- [ ] Dati critici verificati presenti

### Post-Cleanup
- [ ] COMMIT eseguito (se tutto OK)
- [ ] Conteggi finali corretti
- [ ] Integrità referenziale verificata
- [ ] Dati reali presenti e integri
- [ ] Performance database normale
- [ ] Team notificato completamento

### In Caso di Rollback
- [ ] Causa problema identificata
- [ ] Procedura rollback applicata
- [ ] Dati verificati post-rollback
- [ ] Conteggi record corretti
- [ ] Integrità referenziale OK
- [ ] Incident report compilato

---

## Contatti di Supporto

In caso di problemi durante le operazioni:
- **Database Admin**: [Inserire contatto]
- **DevOps Team**: [Inserire contatto]
- **Supabase Support**: https://supabase.com/support

---

## Change Log

| Data | Versione | Autore | Modifiche |
|------|----------|--------|-----------|
| 2025-12-11 | 1.0 | Claude Code | Creazione documento iniziale |

---

**⚠️ RICORDA**:
- Eseguire SEMPRE backup prima di cleanup
- Testare SEMPRE su ambiente non-produzione prima
- Validare SEMPRE statistiche prima di COMMIT
- Documentare SEMPRE le operazioni eseguite
