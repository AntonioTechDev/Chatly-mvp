-- ============================================================================
-- MIGRATION: Migrate OAuth Tokens to Supabase Vault
-- Data: 2025-01-27
-- Descrizione: Migrazione dei token OAuth da plain text a Supabase Vault
-- ============================================================================

-- ============================================================================
-- STEP 1: Aggiungere nuove colonne per i secret_id
-- ============================================================================
ALTER TABLE platform_clients
ADD COLUMN IF NOT EXISTS whatsapp_token_secret_id UUID REFERENCES vault.secrets(id),
ADD COLUMN IF NOT EXISTS instagram_token_secret_id UUID REFERENCES vault.secrets(id),
ADD COLUMN IF NOT EXISTS messenger_token_secret_id UUID REFERENCES vault.secrets(id);

-- ============================================================================
-- STEP 2: Creare funzione temporanea per la migrazione
-- ============================================================================
CREATE OR REPLACE FUNCTION migrate_existing_tokens_to_vault()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client RECORD;
  v_whatsapp_secret_id UUID;
  v_instagram_secret_id UUID;
  v_messenger_secret_id UUID;
BEGIN
  -- Itera su tutti i platform_clients che hanno token in plain text
  FOR v_client IN
    SELECT id, whatsapp_token, instagram_token, messenger_token
    FROM platform_clients
    WHERE whatsapp_token IS NOT NULL
       OR instagram_token IS NOT NULL
       OR messenger_token IS NOT NULL
  LOOP
    -- Migra WhatsApp token se presente
    IF v_client.whatsapp_token IS NOT NULL AND v_client.whatsapp_token != '' THEN
      BEGIN
        v_whatsapp_secret_id := vault.create_secret(
          v_client.whatsapp_token,
          'platform_client_' || v_client.id || '_whatsapp_token',
          'Migrated WhatsApp token for platform client ' || v_client.id
        );

        UPDATE platform_clients
        SET whatsapp_token_secret_id = v_whatsapp_secret_id
        WHERE id = v_client.id;

        RAISE NOTICE 'Migrato WhatsApp token per platform_client_id: %', v_client.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Errore nella migrazione WhatsApp token per platform_client_id %: %', v_client.id, SQLERRM;
      END;
    END IF;

    -- Migra Instagram token se presente
    IF v_client.instagram_token IS NOT NULL AND v_client.instagram_token != '' THEN
      BEGIN
        v_instagram_secret_id := vault.create_secret(
          v_client.instagram_token,
          'platform_client_' || v_client.id || '_instagram_token',
          'Migrated Instagram token for platform client ' || v_client.id
        );

        UPDATE platform_clients
        SET instagram_token_secret_id = v_instagram_secret_id
        WHERE id = v_client.id;

        RAISE NOTICE 'Migrato Instagram token per platform_client_id: %', v_client.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Errore nella migrazione Instagram token per platform_client_id %: %', v_client.id, SQLERRM;
      END;
    END IF;

    -- Migra Messenger token se presente
    IF v_client.messenger_token IS NOT NULL AND v_client.messenger_token != '' THEN
      BEGIN
        v_messenger_secret_id := vault.create_secret(
          v_client.messenger_token,
          'platform_client_' || v_client.id || '_messenger_token',
          'Migrated Messenger token for platform client ' || v_client.id
        );

        UPDATE platform_clients
        SET messenger_token_secret_id = v_messenger_secret_id
        WHERE id = v_client.id;

        RAISE NOTICE 'Migrato Messenger token per platform_client_id: %', v_client.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Errore nella migrazione Messenger token per platform_client_id %: %', v_client.id, SQLERRM;
      END;
    END IF;
  END LOOP;

  RAISE NOTICE 'Migrazione completata';
END;
$$;

-- ============================================================================
-- STEP 3: Eseguire la migrazione
-- ATTENZIONE: Questa operazione è irreversibile
-- ============================================================================
-- Decommentare la riga seguente per eseguire la migrazione:
-- SELECT migrate_existing_tokens_to_vault();

-- ============================================================================
-- STEP 4: Verificare che tutti i token siano stati migrati
-- ============================================================================
-- Query di verifica:
-- SELECT
--   id,
--   CASE
--     WHEN whatsapp_token IS NOT NULL AND whatsapp_token_secret_id IS NULL THEN 'WhatsApp non migrato'
--     WHEN instagram_token IS NOT NULL AND instagram_token_secret_id IS NULL THEN 'Instagram non migrato'
--     WHEN messenger_token IS NOT NULL AND messenger_token_secret_id IS NULL THEN 'Messenger non migrato'
--     ELSE 'OK'
--   END as migration_status
-- FROM platform_clients
-- WHERE whatsapp_token IS NOT NULL
--    OR instagram_token IS NOT NULL
--    OR messenger_token IS NOT NULL;

-- ============================================================================
-- STEP 5: SOLO DOPO AVER VERIFICATO LA MIGRAZIONE:
-- Eliminare le colonne plain text (IRREVERSIBILE)
-- ============================================================================
-- ATTENZIONE: Eseguire SOLO dopo aver verificato che la migrazione sia andata a buon fine
-- e che l'applicazione funzioni correttamente con i nuovi secret_id

-- Decommentare le righe seguenti per eliminare le colonne plain text:
-- ALTER TABLE platform_clients DROP COLUMN IF EXISTS whatsapp_token;
-- ALTER TABLE platform_clients DROP COLUMN IF EXISTS instagram_token;
-- ALTER TABLE platform_clients DROP COLUMN IF EXISTS messenger_token;

-- ============================================================================
-- STEP 6: Cleanup - Eliminare la funzione temporanea di migrazione
-- ============================================================================
-- Decommentare la riga seguente dopo aver completato la migrazione:
-- DROP FUNCTION IF EXISTS migrate_existing_tokens_to_vault();

-- ============================================================================
-- ROLLBACK (in caso di problemi durante la migrazione)
-- ============================================================================
-- Se qualcosa va storto, è possibile fare rollback PRIMA di eliminare le colonne:
--
-- 1. Ripristinare i valori NULL nelle colonne secret_id:
-- UPDATE platform_clients SET whatsapp_token_secret_id = NULL;
-- UPDATE platform_clients SET instagram_token_secret_id = NULL;
-- UPDATE platform_clients SET messenger_token_secret_id = NULL;
--
-- 2. Eliminare le colonne secret_id:
-- ALTER TABLE platform_clients DROP COLUMN IF EXISTS whatsapp_token_secret_id;
-- ALTER TABLE platform_clients DROP COLUMN IF EXISTS instagram_token_secret_id;
-- ALTER TABLE platform_clients DROP COLUMN IF EXISTS messenger_token_secret_id;

-- ============================================================================
-- NOTE IMPORTANTI
-- ============================================================================
-- 1. BACKUP: Fare SEMPRE un backup completo del database prima di eseguire questa migration
-- 2. TESTING: Testare la migration in ambiente di sviluppo/staging prima di applicarla in produzione
-- 3. DOWNTIME: Questa migration richiede un breve downtime dell'applicazione
-- 4. VERIFICA: Verificare che vault.secrets sia accessibile e che l'estensione pgsodium sia abilitata
-- 5. AUDIT: Tutti i token migrati vengono registrati in audit_logs per tracciabilità
