-- =============================================================================
-- SECURITY FIXES - Chatly MVP
-- =============================================================================
-- Data: 2025-12-06
-- Descrizione: Fix per vulnerabilità critiche identificate nel security audit
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FIX #1: ABILITARE RLS SU platform_clients (CRITICO)
-- -----------------------------------------------------------------------------
-- Problema: RLS è disabilitato nonostante esistano policies
-- Impatto: Qualsiasi utente può accedere ai dati di tutti i platform_clients
-- Soluzione: Abilitare RLS

ALTER TABLE platform_clients ENABLE ROW LEVEL SECURITY;

-- Verifica che le policies esistenti siano corrette
-- (Queste dovrebbero già esistere secondo SECURITY_NOTES.md)

-- Policy SELECT: Gli utenti possono vedere solo il proprio profilo
-- DROP POLICY IF EXISTS "Users can view own platform_client" ON platform_clients;
-- CREATE POLICY "Users can view own platform_client" ON platform_clients
-- FOR SELECT USING (user_id = auth.uid());

-- Policy UPDATE: Gli utenti possono modificare solo il proprio profilo
-- DROP POLICY IF EXISTS "Users can update own platform_client" ON platform_clients;
-- CREATE POLICY "Users can update own platform_client" ON platform_clients
-- FOR UPDATE USING (user_id = auth.uid());

-- Policy INSERT: Gli utenti possono creare solo il proprio profilo
-- DROP POLICY IF EXISTS "Users can insert own platform_client" ON platform_clients;
-- CREATE POLICY "Users can insert own platform_client" ON platform_clients
-- FOR INSERT WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- FIX #2: AGGIUNGERE POLICIES INSERT PER messages (CRITICO)
-- -----------------------------------------------------------------------------
-- Problema: Manca policy INSERT, utente può inserire messaggi per altri
-- Soluzione: Policy che verifica ownership tramite conversation -> platform_client

CREATE POLICY "Users can insert messages in own conversations" ON messages
FOR INSERT WITH CHECK (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    INNER JOIN platform_clients pc ON c.platform_client_id = pc.id
    WHERE pc.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #3: AGGIUNGERE POLICIES UPDATE PER messages (ALTO)
-- -----------------------------------------------------------------------------
-- Problema: Utente può modificare messaggi altrui
-- Soluzione: Policy che verifica ownership

CREATE POLICY "Users can update messages in own conversations" ON messages
FOR UPDATE USING (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    INNER JOIN platform_clients pc ON c.platform_client_id = pc.id
    WHERE pc.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #4: AGGIUNGERE POLICIES DELETE PER messages (ALTO)
-- -----------------------------------------------------------------------------
-- Problema: Utente può cancellare messaggi altrui
-- Soluzione: Policy che verifica ownership

CREATE POLICY "Users can delete messages in own conversations" ON messages
FOR DELETE USING (
  conversation_id IN (
    SELECT c.id
    FROM conversations c
    INNER JOIN platform_clients pc ON c.platform_client_id = pc.id
    WHERE pc.user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #5: AGGIUNGERE POLICIES INSERT PER conversations (CRITICO)
-- -----------------------------------------------------------------------------
-- Problema: Utente può creare conversazioni per altri platform_clients
-- Soluzione: Policy che verifica ownership

CREATE POLICY "Users can insert own conversations" ON conversations
FOR INSERT WITH CHECK (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #6: AGGIUNGERE POLICIES UPDATE PER conversations (ALTO)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can update own conversations" ON conversations
FOR UPDATE USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #7: AGGIUNGERE POLICIES DELETE PER conversations (ALTO)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can delete own conversations" ON conversations
FOR DELETE USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #8: AGGIUNGERE POLICIES INSERT PER social_contacts (CRITICO)
-- -----------------------------------------------------------------------------
-- Problema: Utente può creare contatti per altri platform_clients
-- Soluzione: Policy che verifica ownership

CREATE POLICY "Users can insert own contacts" ON social_contacts
FOR INSERT WITH CHECK (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #9: AGGIUNGERE POLICIES UPDATE PER social_contacts (ALTO)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can update own contacts" ON social_contacts
FOR UPDATE USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- FIX #10: AGGIUNGERE POLICIES DELETE PER social_contacts (ALTO)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can delete own contacts" ON social_contacts
FOR DELETE USING (
  platform_client_id IN (
    SELECT id FROM platform_clients WHERE user_id = auth.uid()
  )
);

-- =============================================================================
-- VERIFICA DELLE POLICIES
-- =============================================================================
-- Esegui questa query per verificare che tutte le policies siano attive:

/*
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('platform_clients', 'conversations', 'messages', 'social_contacts')
ORDER BY tablename, cmd;
*/

-- =============================================================================
-- TESTING DELLE POLICIES
-- =============================================================================
-- Test che un utente NON possa accedere ai dati di altri:

/*
-- Come user1:
SET LOCAL jwt.claims.sub = 'user1-uuid';

-- Questo dovrebbe restituire solo i dati di user1
SELECT * FROM platform_clients;

-- Tentativo di INSERT per un altro platform_client (dovrebbe fallire)
INSERT INTO messages (conversation_id, sender_type, content_text)
VALUES (999, 'user', 'Test malicious');  -- Dovrebbe FALLIRE se 999 non appartiene a user1
*/

-- =============================================================================
-- ROLLBACK (in caso di problemi)
-- =============================================================================
-- Se qualcosa va storto, puoi fare rollback con:

/*
-- Disabilita temporaneamente RLS (solo per debug!)
-- ALTER TABLE platform_clients DISABLE ROW LEVEL SECURITY;

-- Rimuovi policies
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own contacts" ON social_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON social_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON social_contacts;
*/

-- =============================================================================
-- NOTE FINALI
-- =============================================================================
-- Dopo aver eseguito queste fix:
-- 1. Testa l'applicazione per verificare che tutto funzioni
-- 2. Verifica che gli utenti NON possano accedere ai dati altrui
-- 3. Controlla i log per eventuali errori RLS
-- 4. Aggiorna SECURITY_NOTES.md con lo stato attuale
-- =============================================================================
