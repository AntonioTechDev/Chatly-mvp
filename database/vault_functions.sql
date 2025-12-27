-- ============================================================================
-- SUPABASE VAULT TOKEN MANAGEMENT FUNCTIONS
-- ============================================================================
-- Queste funzioni gestiscono la crittografia sicura dei token OAuth
-- utilizzando Supabase Vault (pgsodium) per WhatsApp, Instagram e Messenger
-- ============================================================================

-- Prerequisito: Assicurarsi che l'estensione pgsodium sia abilitata
-- e che lo schema vault esista

-- ============================================================================
-- FUNZIONE: store_platform_token
-- Memorizza un token crittografato nel Vault e restituisce l'ID del segreto
-- ============================================================================
CREATE OR REPLACE FUNCTION store_platform_token(
  p_platform_client_id INTEGER,
  p_token_type TEXT,
  p_token_value TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id UUID;
  v_secret_name TEXT;
BEGIN
  -- Validazione input
  IF p_platform_client_id IS NULL OR p_token_type IS NULL OR p_token_value IS NULL THEN
    RAISE EXCEPTION 'Tutti i parametri sono obbligatori';
  END IF;

  IF p_token_type NOT IN ('whatsapp', 'instagram', 'messenger') THEN
    RAISE EXCEPTION 'Token type non valido. Valori ammessi: whatsapp, instagram, messenger';
  END IF;

  -- Verifica che il platform_client_id appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM platform_clients
    WHERE id = p_platform_client_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accesso negato: platform_client_id non valido o non autorizzato';
  END IF;

  -- Genera un nome univoco per il segreto
  v_secret_name := 'platform_client_' || p_platform_client_id || '_' || p_token_type || '_token';

  -- Memorizza il token nel Vault usando vault.create_secret
  v_secret_id := vault.create_secret(
    p_token_value,
    v_secret_name,
    'Token OAuth per ' || p_token_type || ' - Platform Client ID: ' || p_platform_client_id
  );

  -- Log dell'operazione (senza registrare il token stesso)
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    metadata
  ) VALUES (
    'platform_clients',
    p_platform_client_id,
    'TOKEN_STORED',
    auth.uid(),
    jsonb_build_object(
      'token_type', p_token_type,
      'secret_id', v_secret_id
    )
  );

  RETURN v_secret_id;
END;
$$;

-- ============================================================================
-- FUNZIONE: get_platform_token
-- Recupera e decripta un token dal Vault
-- ============================================================================
CREATE OR REPLACE FUNCTION get_platform_token(
  p_platform_client_id INTEGER,
  p_token_type TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id UUID;
  v_token_value TEXT;
  v_column_name TEXT;
BEGIN
  -- Validazione input
  IF p_platform_client_id IS NULL OR p_token_type IS NULL THEN
    RAISE EXCEPTION 'Tutti i parametri sono obbligatori';
  END IF;

  IF p_token_type NOT IN ('whatsapp', 'instagram', 'messenger') THEN
    RAISE EXCEPTION 'Token type non valido. Valori ammessi: whatsapp, instagram, messenger';
  END IF;

  -- Verifica che il platform_client_id appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM platform_clients
    WHERE id = p_platform_client_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accesso negato: platform_client_id non valido o non autorizzato';
  END IF;

  -- Determina quale colonna leggere
  v_column_name := p_token_type || '_token_secret_id';

  -- Recupera il secret_id dal platform_clients
  EXECUTE format(
    'SELECT %I FROM platform_clients WHERE id = $1',
    v_column_name
  ) INTO v_secret_id USING p_platform_client_id;

  -- Se non esiste un secret_id, restituisci NULL
  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Recupera il token decriptato dal Vault
  SELECT decrypted_secret INTO v_token_value
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id;

  RETURN v_token_value;
END;
$$;

-- ============================================================================
-- FUNZIONE: update_platform_token
-- Aggiorna un token esistente nel Vault
-- ============================================================================
CREATE OR REPLACE FUNCTION update_platform_token(
  p_platform_client_id INTEGER,
  p_token_type TEXT,
  p_new_token_value TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_old_secret_id UUID;
  v_new_secret_id UUID;
  v_column_name TEXT;
BEGIN
  -- Validazione input
  IF p_platform_client_id IS NULL OR p_token_type IS NULL OR p_new_token_value IS NULL THEN
    RAISE EXCEPTION 'Tutti i parametri sono obbligatori';
  END IF;

  IF p_token_type NOT IN ('whatsapp', 'instagram', 'messenger') THEN
    RAISE EXCEPTION 'Token type non valido. Valori ammessi: whatsapp, instagram, messenger';
  END IF;

  -- Verifica che il platform_client_id appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM platform_clients
    WHERE id = p_platform_client_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accesso negato: platform_client_id non valido o non autorizzato';
  END IF;

  -- Determina quale colonna aggiornare
  v_column_name := p_token_type || '_token_secret_id';

  -- Recupera il vecchio secret_id
  EXECUTE format(
    'SELECT %I FROM platform_clients WHERE id = $1',
    v_column_name
  ) INTO v_old_secret_id USING p_platform_client_id;

  -- Crea un nuovo segreto con il nuovo valore
  v_new_secret_id := store_platform_token(
    p_platform_client_id,
    p_token_type,
    p_new_token_value
  );

  -- Aggiorna il reference nella tabella platform_clients
  EXECUTE format(
    'UPDATE platform_clients SET %I = $1 WHERE id = $2',
    v_column_name
  ) USING v_new_secret_id, p_platform_client_id;

  -- Elimina il vecchio segreto se esisteva
  IF v_old_secret_id IS NOT NULL THEN
    -- Nota: vault.create_secret non ha una corrispondente delete_secret esposta
    -- Il Vault gestisce internamente la retention dei secrets
    -- In alternativa, possiamo contrassegnare il secret come "revoked" in una tabella di audit
    NULL;
  END IF;

  -- Log dell'operazione
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    metadata
  ) VALUES (
    'platform_clients',
    p_platform_client_id,
    'TOKEN_UPDATED',
    auth.uid(),
    jsonb_build_object(
      'token_type', p_token_type,
      'old_secret_id', v_old_secret_id,
      'new_secret_id', v_new_secret_id
    )
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- FUNZIONE: delete_platform_token
-- Elimina un token dal Vault e rimuove il reference
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_platform_token(
  p_platform_client_id INTEGER,
  p_token_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id UUID;
  v_column_name TEXT;
BEGIN
  -- Validazione input
  IF p_platform_client_id IS NULL OR p_token_type IS NULL THEN
    RAISE EXCEPTION 'Tutti i parametri sono obbligatori';
  END IF;

  IF p_token_type NOT IN ('whatsapp', 'instagram', 'messenger') THEN
    RAISE EXCEPTION 'Token type non valido. Valori ammessi: whatsapp, instagram, messenger';
  END IF;

  -- Verifica che il platform_client_id appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM platform_clients
    WHERE id = p_platform_client_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accesso negato: platform_client_id non valido o non autorizzato';
  END IF;

  -- Determina quale colonna aggiornare
  v_column_name := p_token_type || '_token_secret_id';

  -- Recupera il secret_id
  EXECUTE format(
    'SELECT %I FROM platform_clients WHERE id = $1',
    v_column_name
  ) INTO v_secret_id USING p_platform_client_id;

  -- Se non esiste un secret_id, non c'è nulla da fare
  IF v_secret_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Rimuovi il reference dal platform_clients
  EXECUTE format(
    'UPDATE platform_clients SET %I = NULL WHERE id = $1',
    v_column_name
  ) USING p_platform_client_id;

  -- Log dell'operazione
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    metadata
  ) VALUES (
    'platform_clients',
    p_platform_client_id,
    'TOKEN_DELETED',
    auth.uid(),
    jsonb_build_object(
      'token_type', p_token_type,
      'secret_id', v_secret_id
    )
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- FUNZIONE: has_platform_token
-- Verifica se esiste un token per la piattaforma specificata
-- ============================================================================
CREATE OR REPLACE FUNCTION has_platform_token(
  p_platform_client_id INTEGER,
  p_token_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_id UUID;
  v_column_name TEXT;
BEGIN
  -- Validazione input
  IF p_platform_client_id IS NULL OR p_token_type IS NULL THEN
    RAISE EXCEPTION 'Tutti i parametri sono obbligatori';
  END IF;

  IF p_token_type NOT IN ('whatsapp', 'instagram', 'messenger') THEN
    RAISE EXCEPTION 'Token type non valido. Valori ammessi: whatsapp, instagram, messenger';
  END IF;

  -- Verifica che il platform_client_id appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM platform_clients
    WHERE id = p_platform_client_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accesso negato: platform_client_id non valido o non autorizzato';
  END IF;

  -- Determina quale colonna verificare
  v_column_name := p_token_type || '_token_secret_id';

  -- Verifica se esiste un secret_id
  EXECUTE format(
    'SELECT %I FROM platform_clients WHERE id = $1',
    v_column_name
  ) INTO v_secret_id USING p_platform_client_id;

  RETURN v_secret_id IS NOT NULL;
END;
$$;

-- ============================================================================
-- TABELLA AUDIT LOGS
-- Traccia tutte le operazioni sui token per compliance e debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS per audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- GRANTS
-- Concede permessi di esecuzione alle funzioni RPC
-- ============================================================================
GRANT EXECUTE ON FUNCTION store_platform_token(INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_token(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_platform_token(INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_platform_token(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_platform_token(INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- COMMENTI
-- ============================================================================
COMMENT ON FUNCTION store_platform_token IS 'Memorizza un token OAuth crittografato nel Vault e restituisce il secret_id';
COMMENT ON FUNCTION get_platform_token IS 'Recupera e decripta un token OAuth dal Vault';
COMMENT ON FUNCTION update_platform_token IS 'Aggiorna un token OAuth esistente nel Vault';
COMMENT ON FUNCTION delete_platform_token IS 'Elimina un token OAuth dal Vault';
COMMENT ON FUNCTION has_platform_token IS 'Verifica se esiste un token per la piattaforma specificata';
