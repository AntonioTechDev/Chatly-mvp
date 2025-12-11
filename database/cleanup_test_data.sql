-- ============================================
-- CHATLY DATABASE - ELIMINAZIONE DATI TEST
-- ============================================
-- Data: 2025-12-11
-- Descrizione: Script per eliminare selettivamente dati di test
--
-- ATTENZIONE:
-- 1. ESEGUIRE BACKUP COMPLETO PRIMA (backup_complete.sql)
-- 2. TESTARE SU COPIA DATABASE PRIMA DI PRODUZIONE
-- 3. VERIFICARE PATTERN DI TEST PRIMA DELL'ESECUZIONE
--
-- Pattern identificati per dati test:
-- - Email: test*@example.com
-- - Platform User ID: test_user_*, test_special_user
-- - Display names numerati: "Nome Cognome [Numero]"
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: IDENTIFICAZIONE DATI TEST
-- ============================================

-- Creare tabella temporanea con IDs social_contacts di test
CREATE TEMP TABLE test_social_contacts AS
SELECT id
FROM social_contacts
WHERE
    -- Pattern email test
    (email LIKE 'test%@example.com')
    OR
    -- Pattern platform_user_id test
    (platform_user_id LIKE 'test_%')
    OR
    -- Pattern display_name numerato (es: "Laura Bianchi 1")
    (display_name ~ '.*\s\d+$')
    OR
    -- Telefoni fittizi pattern
    (phone ~ '^393300000\d{3}$');

-- Verifica contatti test identificati
SELECT
    'CONTATTI TEST IDENTIFICATI' AS step,
    COUNT(*) AS total_test_contacts,
    COUNT(*) FILTER (WHERE email LIKE 'test%@example.com') AS email_test_pattern,
    COUNT(*) FILTER (WHERE platform_user_id LIKE 'test_%') AS platform_id_test_pattern,
    COUNT(*) FILTER (WHERE display_name ~ '.*\s\d+$') AS display_name_numbered,
    COUNT(*) FILTER (WHERE phone ~ '^393300000\d{3}$') AS fake_phone_pattern
FROM test_social_contacts;

-- Mostra esempio contatti da eliminare
SELECT
    'ESEMPIO CONTATTI DA ELIMINARE (primi 5)' AS preview,
    sc.id,
    sc.display_name,
    sc.email,
    sc.phone,
    sc.platform,
    sc.platform_user_id
FROM social_contacts sc
INNER JOIN test_social_contacts tsc ON sc.id = tsc.id
ORDER BY sc.id
LIMIT 5;

-- ============================================
-- STEP 2: CONTEGGIO PRE-ELIMINAZIONE
-- ============================================

-- Statistiche prima dell'eliminazione
SELECT
    'STATISTICHE PRE-ELIMINAZIONE' AS report,
    (SELECT COUNT(*) FROM social_contacts) AS total_social_contacts,
    (SELECT COUNT(*) FROM test_social_contacts) AS test_social_contacts,
    (SELECT COUNT(*) FROM conversations WHERE social_contact_id IN (SELECT id FROM test_social_contacts)) AS test_conversations,
    (SELECT COUNT(*) FROM messages WHERE social_contact_id IN (SELECT id FROM test_social_contacts)) AS test_messages,
    (SELECT COUNT(*) FROM appointments WHERE social_contact_id IN (SELECT id FROM test_social_contacts)) AS test_appointments,
    (SELECT COUNT(*) FROM n8n_chat_histories WHERE session_id IN (SELECT platform_user_id FROM social_contacts WHERE id IN (SELECT id FROM test_social_contacts))) AS test_n8n_histories;

-- ============================================
-- STEP 3: ELIMINAZIONE CASCADE
-- ============================================

-- Eliminare appointments collegati a contatti test
DELETE FROM appointments
WHERE social_contact_id IN (SELECT id FROM test_social_contacts);

-- Eliminare messaggi collegati a contatti test
DELETE FROM messages
WHERE social_contact_id IN (SELECT id FROM test_social_contacts);

-- Eliminare conversazioni collegate a contatti test
DELETE FROM conversations
WHERE social_contact_id IN (SELECT id FROM test_social_contacts);

-- Eliminare storico n8n correlato
DELETE FROM n8n_chat_histories
WHERE session_id IN (
    SELECT platform_user_id
    FROM social_contacts
    WHERE id IN (SELECT id FROM test_social_contacts)
);

-- Eliminare social_contacts test
DELETE FROM social_contacts
WHERE id IN (SELECT id FROM test_social_contacts);

-- ============================================
-- STEP 4: CLEANUP AGGIUNTIVO (OPZIONALE)
-- ============================================

-- Eliminare documenti test (se esistono pattern identificabili)
-- NOTA: Verificare pattern prima di decommentare
-- DELETE FROM documents
-- WHERE metadata->>'source' = 'test'
-- OR metadata->>'type' = 'test';

-- Eliminare user_documents test (se esistono)
-- NOTA: Verificare pattern prima di decommentare
-- DELETE FROM user_documents
-- WHERE file_name LIKE 'test_%'
-- OR description LIKE '%test%';

-- ============================================
-- STEP 5: PULIZIA N8N HISTORIES GENERICA
-- ============================================

-- Eliminare storico n8n molto vecchio (oltre 30 giorni)
-- NOTA: Decommentare solo se necessario
-- DELETE FROM n8n_chat_histories
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================
-- STEP 6: VACUUM E OTTIMIZZAZIONE
-- ============================================

-- Reset sequences per mantenere ID consistenti
-- NOTA: Eseguire solo se necessario ricompattare ID
-- SELECT setval('social_contacts_id_seq', COALESCE(MAX(id), 1)) FROM social_contacts;
-- SELECT setval('conversations_id_seq', COALESCE(MAX(id), 1)) FROM conversations;
-- SELECT setval('messages_id_seq', COALESCE(MAX(id), 1)) FROM messages;

-- ============================================
-- STEP 7: VERIFICA POST-ELIMINAZIONE
-- ============================================

-- Statistiche finali
SELECT
    'STATISTICHE POST-ELIMINAZIONE' AS report,
    (SELECT COUNT(*) FROM social_contacts) AS remaining_social_contacts,
    (SELECT COUNT(*) FROM conversations) AS remaining_conversations,
    (SELECT COUNT(*) FROM messages) AS remaining_messages,
    (SELECT COUNT(*) FROM appointments) AS remaining_appointments,
    (SELECT COUNT(*) FROM n8n_chat_histories) AS remaining_n8n_histories;

-- Mostra contatti rimanenti per verifica
SELECT
    'CONTATTI RIMANENTI (sample)' AS verification,
    id,
    display_name,
    email,
    phone,
    platform,
    qualification_status,
    first_contact
FROM social_contacts
ORDER BY id
LIMIT 10;

COMMIT;

-- ============================================
-- FINE CLEANUP
-- ============================================
-- NOTA IMPORTANTE:
-- Se tutto è OK, fare COMMIT
-- Se qualcosa non va, fare ROLLBACK prima del COMMIT
-- ============================================

-- Per rollback completo:
-- ROLLBACK;
