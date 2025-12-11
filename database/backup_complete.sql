-- ============================================
-- CHATLY DATABASE - BACKUP COMPLETO
-- ============================================
-- Data: 2025-12-11
-- Descrizione: Script per backup completo del database Supabase
--
-- ISTRUZIONI:
-- 1. Eseguire questo script prima di qualsiasi operazione di cleanup
-- 2. Salvare l'output in un file per rollback futuro
-- 3. Testare su ambiente di staging prima di produzione
-- ============================================

BEGIN;

-- ============================================
-- TABELLE LOOKUP (Dati di Riferimento)
-- ============================================

-- Backup message_types
CREATE TEMP TABLE IF NOT EXISTS backup_message_types AS
SELECT * FROM message_types;

-- Backup message_directions
CREATE TEMP TABLE IF NOT EXISTS backup_message_directions AS
SELECT * FROM message_directions;

-- Backup sender_types
CREATE TEMP TABLE IF NOT EXISTS backup_sender_types AS
SELECT * FROM sender_types;

-- ============================================
-- TABELLE PRINCIPALI
-- ============================================

-- Backup platform_clients
CREATE TEMP TABLE IF NOT EXISTS backup_platform_clients AS
SELECT * FROM platform_clients;

-- Backup plans
CREATE TEMP TABLE IF NOT EXISTS backup_plans AS
SELECT * FROM plans;

-- Backup social_contacts
CREATE TEMP TABLE IF NOT EXISTS backup_social_contacts AS
SELECT * FROM social_contacts;

-- Backup conversations
CREATE TEMP TABLE IF NOT EXISTS backup_conversations AS
SELECT * FROM conversations;

-- Backup messages
CREATE TEMP TABLE IF NOT EXISTS backup_messages AS
SELECT * FROM messages;

-- Backup appointments
CREATE TEMP TABLE IF NOT EXISTS backup_appointments AS
SELECT * FROM appointments;

-- Backup n8n_chat_histories
CREATE TEMP TABLE IF NOT EXISTS backup_n8n_chat_histories AS
SELECT * FROM n8n_chat_histories;

-- Backup user_documents
CREATE TEMP TABLE IF NOT EXISTS backup_user_documents AS
SELECT * FROM user_documents;

-- Backup documents (vettorizzati)
CREATE TEMP TABLE IF NOT EXISTS backup_documents AS
SELECT * FROM documents;

-- ============================================
-- EXPORT DATI PER BACKUP PERMANENTE
-- ============================================

-- Statistiche backup
SELECT
    'BACKUP COMPLETATO - ' || NOW()::TEXT AS status,
    (SELECT COUNT(*) FROM backup_platform_clients) AS platform_clients_count,
    (SELECT COUNT(*) FROM backup_social_contacts) AS social_contacts_count,
    (SELECT COUNT(*) FROM backup_conversations) AS conversations_count,
    (SELECT COUNT(*) FROM backup_messages) AS messages_count,
    (SELECT COUNT(*) FROM backup_appointments) AS appointments_count,
    (SELECT COUNT(*) FROM backup_n8n_chat_histories) AS n8n_histories_count,
    (SELECT COUNT(*) FROM backup_user_documents) AS user_documents_count,
    (SELECT COUNT(*) FROM backup_documents) AS documents_count;

-- ============================================
-- EXPORT DATI IN FORMATO SQL
-- ============================================

-- message_types
SELECT 'INSERT INTO message_types (code, display_name, is_media, is_system, created_at) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L)', code, display_name, is_media, is_system, created_at),
        ', '
    ) || ';' AS backup_sql
FROM backup_message_types;

-- message_directions
SELECT 'INSERT INTO message_directions (code, display_name, is_inbound, created_at) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L)', code, display_name, is_inbound, created_at),
        ', '
    ) || ';' AS backup_sql
FROM backup_message_directions;

-- sender_types
SELECT 'INSERT INTO sender_types (code, display_name, is_human, is_bot, is_system, created_at) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L, %L)', code, display_name, is_human, is_bot, is_system, created_at),
        ', '
    ) || ';' AS backup_sql
FROM backup_sender_types;

-- platform_clients
SELECT 'INSERT INTO platform_clients (id, business_name, email, phone, subscription_plan, status, whatsapp_phone_id, instagram_account_id, messenger_page_id, created_at, updated_at, plan_id, user_id, whatsapp_token_secret_id, instagram_token_secret_id, messenger_token_secret_id) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)',
            id, business_name, email, phone, subscription_plan, status,
            whatsapp_phone_id, instagram_account_id, messenger_page_id,
            created_at, updated_at, plan_id, user_id,
            whatsapp_token_secret_id, instagram_token_secret_id, messenger_token_secret_id),
        ', '
    ) || ';' AS backup_sql
FROM backup_platform_clients;

-- plans
SELECT CASE
    WHEN COUNT(*) > 0 THEN
        'INSERT INTO plans (id, name, max_contacts, max_messages_per_month, support_level, price_monthly, features) VALUES ' ||
        string_agg(
            format('(%L, %L, %L, %L, %L, %L, %L)',
                id, name, max_contacts, max_messages_per_month, support_level, price_monthly, features),
            ', '
        ) || ';'
    ELSE '-- No plans to backup'
END AS backup_sql
FROM backup_plans;

-- social_contacts (limitato ai campi principali per leggibilità)
SELECT 'INSERT INTO social_contacts (id, platform_client_id, platform, platform_user_id, display_name, profile_data, name, surname, email, phone, company, age, volume, plan_suggested, qualification_status, data_completeness, first_contact, last_interaction, lead_source, lead_score, goal) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)',
            id, platform_client_id, platform, platform_user_id, display_name, profile_data::text,
            name, surname, email, phone, company, age, volume, plan_suggested,
            qualification_status, data_completeness, first_contact, last_interaction,
            lead_source, lead_score, goal::text),
        ', '
    ) || ';' AS backup_sql
FROM backup_social_contacts;

-- conversations
SELECT 'INSERT INTO conversations (id, social_contact_id, platform_client_id, channel, status, started_at, closed_at) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L, %L, %L)',
            id, social_contact_id, platform_client_id, channel, status, started_at, closed_at),
        ', '
    ) || ';' AS backup_sql
FROM backup_conversations;

-- messages (può essere molto grande - considerare batch)
SELECT 'INSERT INTO messages (id, social_contact_id, direction, message_type, content_text, content_media, platform_message_id, created_at, conversation_id, sender_type) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L)',
            id, social_contact_id, direction, message_type, content_text,
            content_media::text, platform_message_id, created_at, conversation_id, sender_type),
        ', '
    ) || ';' AS backup_sql
FROM backup_messages;

-- appointments
SELECT CASE
    WHEN COUNT(*) > 0 THEN
        'INSERT INTO appointments (id, platform_client_id, social_contact_id, scheduled_for, status, created_at, updated_at, notes) VALUES ' ||
        string_agg(
            format('(%L, %L, %L, %L, %L, %L, %L, %L)',
                id, platform_client_id, social_contact_id, scheduled_for, status, created_at, updated_at, notes),
            ', '
        ) || ';'
    ELSE '-- No appointments to backup'
END AS backup_sql
FROM backup_appointments;

-- n8n_chat_histories
SELECT 'INSERT INTO n8n_chat_histories (id, session_id, message, created_at) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L)',
            id, session_id, message::text, created_at),
        ', '
    ) || ';' AS backup_sql
FROM backup_n8n_chat_histories;

-- user_documents
SELECT 'INSERT INTO user_documents (id, platform_client_id, user_id, file_name, file_size, mime_type, storage_path, drive_file_id, drive_web_view_link, category, description, tags, uploaded_at, updated_at) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L)',
            id, platform_client_id, user_id, file_name, file_size, mime_type,
            storage_path, drive_file_id, drive_web_view_link, category, description,
            tags, uploaded_at, updated_at),
        ', '
    ) || ';' AS backup_sql
FROM backup_user_documents;

-- documents (vettorizzati - senza embedding per dimensione)
SELECT 'INSERT INTO documents (id, content, metadata, platform_client_id, user_document_id) VALUES ' ||
    string_agg(
        format('(%L, %L, %L, %L, %L)',
            id, content, metadata::text, platform_client_id, user_document_id),
        ', '
    ) || ';' AS backup_sql
FROM backup_documents;

COMMIT;

-- ============================================
-- FINE BACKUP
-- ============================================
-- Note:
-- - Le tabelle temp saranno distrutte alla fine della sessione
-- - Per backup permanente, salvare l'output delle SELECT in file SQL
-- - Per tabelle molto grandi (messages), considerare pg_dump o supabase db dump
-- ============================================
