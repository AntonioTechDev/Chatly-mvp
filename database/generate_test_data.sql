-- Script per generare dati di test
-- 50 conversazioni distribuite tra canali con date diverse
-- Una conversazione speciale con 100+ messaggi

DO $$
DECLARE
  client_id bigint := 12;
  contact_id bigint;
  conv_id bigint;
  i integer;
  j integer;
  channel_type text;
  random_days integer;
  base_date timestamp;
  test_phone text := '3505354455';
  special_contact_id bigint;
  special_conv_id bigint;
BEGIN
  -- Crea il contatto speciale per il test scroll
  INSERT INTO social_contacts (
    platform_client_id, platform, platform_user_id, display_name,
    phone, name, surname, qualification_status, first_contact
  ) VALUES (
    client_id, 'whatsapp', 'test_special_user', 'Test Scroll User',
    test_phone, 'Test', 'Scroll', 'qualified', NOW() - interval '60 days'
  ) RETURNING id INTO special_contact_id;

  -- Crea conversazione per il contatto speciale
  INSERT INTO conversations (
    social_contact_id, platform_client_id, channel, status, started_at
  ) VALUES (
    special_contact_id, client_id, 'whatsapp', 'open', NOW() - interval '60 days'
  ) RETURNING id INTO special_conv_id;

  -- Aggiungi 120 messaggi alla conversazione speciale (per testare scroll)
  FOR i IN 1..120 LOOP
    base_date := NOW() - interval '60 days' + (i || ' hours')::interval;

    -- Alterna tra messaggi del cliente e risposte dell'agente
    IF i % 2 = 1 THEN
      INSERT INTO messages (
        social_contact_id, conversation_id, direction, message_type,
        content_text, sender_type, created_at
      ) VALUES (
        special_contact_id, special_conv_id, 'inbound', 'text',
        'Messaggio di test ' || i || ' - Ciao! Vorrei avere maggiori informazioni sul vostro servizio.',
        'user', base_date
      );
    ELSE
      INSERT INTO messages (
        social_contact_id, conversation_id, direction, message_type,
        content_text, sender_type, created_at
      ) VALUES (
        special_contact_id, special_conv_id, 'outbound', 'text',
        'Risposta ' || i || ' - Certo! Sarò felice di aiutarti. Che cosa vorresti sapere?',
        'agent', base_date
      );
    END IF;
  END LOOP;

  -- Genera 50 conversazioni di test distribuite tra i canali
  FOR i IN 1..50 LOOP
    -- Seleziona canale in rotazione
    IF i % 3 = 0 THEN
      channel_type := 'whatsapp';
    ELSIF i % 3 = 1 THEN
      channel_type := 'instagram';
    ELSE
      channel_type := 'messenger';
    END IF;

    -- Genera una data casuale negli ultimi 90 giorni
    random_days := (random() * 90)::integer;
    base_date := NOW() - (random_days || ' days')::interval;

    -- Crea social contact
    INSERT INTO social_contacts (
      platform_client_id, platform, platform_user_id, display_name,
      phone, name, surname, email, company, qualification_status, first_contact
    ) VALUES (
      client_id,
      channel_type,
      'test_user_' || i,
      CASE
        WHEN i % 5 = 0 THEN 'Mario Rossi'
        WHEN i % 5 = 1 THEN 'Laura Bianchi'
        WHEN i % 5 = 2 THEN 'Giuseppe Verdi'
        WHEN i % 5 = 3 THEN 'Anna Neri'
        ELSE 'Paolo Ferrari'
      END || ' ' || i,
      CASE WHEN channel_type = 'whatsapp' THEN '39' || (3300000000 + i)::text ELSE NULL END,
      CASE
        WHEN i % 5 = 0 THEN 'Mario'
        WHEN i % 5 = 1 THEN 'Laura'
        WHEN i % 5 = 2 THEN 'Giuseppe'
        WHEN i % 5 = 3 THEN 'Anna'
        ELSE 'Paolo'
      END,
      CASE
        WHEN i % 5 = 0 THEN 'Rossi'
        WHEN i % 5 = 1 THEN 'Bianchi'
        WHEN i % 5 = 2 THEN 'Verdi'
        WHEN i % 5 = 3 THEN 'Neri'
        ELSE 'Ferrari'
      END,
      'test' || i || '@example.com',
      CASE
        WHEN i % 4 = 0 THEN 'Tech Solutions SRL'
        WHEN i % 4 = 1 THEN 'Digital Marketing Agency'
        WHEN i % 4 = 2 THEN 'E-commerce Italia'
        ELSE 'Startup Innovativa'
      END,
      CASE
        WHEN i % 3 = 0 THEN 'qualified'
        WHEN i % 3 = 1 THEN 'new'
        ELSE 'nurturing'
      END,
      base_date
    ) RETURNING id INTO contact_id;

    -- Crea conversazione
    INSERT INTO conversations (
      social_contact_id, platform_client_id, channel, status, started_at
    ) VALUES (
      contact_id, client_id, channel_type,
      CASE WHEN i % 4 = 0 THEN 'closed' ELSE 'open' END,
      base_date
    ) RETURNING id INTO conv_id;

    -- Aggiungi 2-4 messaggi per conversazione
    FOR j IN 1..(2 + (random() * 3)::integer) LOOP
      -- Alterna tra messaggi in entrata e in uscita
      IF j % 2 = 1 THEN
        INSERT INTO messages (
          social_contact_id, conversation_id, direction, message_type,
          content_text, sender_type, created_at
        ) VALUES (
          contact_id, conv_id, 'inbound', 'text',
          CASE j
            WHEN 1 THEN 'Ciao! Ho visto il vostro servizio e sono interessato.'
            WHEN 3 THEN 'Quali sono i prezzi?'
            ELSE 'Grazie per le informazioni!'
          END,
          'user',
          base_date + (j || ' hours')::interval
        );
      ELSE
        INSERT INTO messages (
          social_contact_id, conversation_id, direction, message_type,
          content_text, sender_type, created_at
        ) VALUES (
          contact_id, conv_id, 'outbound', 'text',
          CASE j
            WHEN 2 THEN 'Buongiorno! Grazie per averci contattato. Sono qui per aiutarti.'
            WHEN 4 THEN 'I nostri piani partono da 29€/mese. Vuoi maggiori dettagli?'
            ELSE 'Prego! Resto a disposizione per qualsiasi domanda.'
          END,
          CASE
            WHEN i % 3 = 0 THEN 'agent'
            WHEN i % 3 = 1 THEN 'bot'
            ELSE 'ai_assistant'
          END,
          base_date + (j || ' hours')::interval
        );
      END IF;
    END LOOP;

  END LOOP;

END $$;
