# Chatly - Changelog

Registro delle modifiche e implementazioni features per Chatly.

---

## Task 1: Database Cleanup Script

**Data**: 2025-12-11
**Branch**: `feature/task-1-database-cleanup`

- **Implementato**: Sistema completo per backup e pulizia database Supabase con identificazione automatica dati test tramite pattern matching (email test*, platform_user_id test_*, display_name numerati). Include script SQL per backup completo, eliminazione selettiva e documentazione rollback dettagliata con 3 metodi di ripristino.

- **File creati**:
  - `database/backup_complete.sql` - Script backup completo database
  - `database/cleanup_test_data.sql` - Script eliminazione selettiva dati test
  - `database/ROLLBACK_PROCEDURE.md` - Documentazione procedure backup/rollback

- **Note tecniche**:
  - Pattern identificazione test: email `test*@example.com`, platform_user_id `test_*`, display_name `.*\s\d+$`, telefoni `393300000XXX`
  - Test dry-run validato: 51 contatti test identificati su 57 totali, 6 contatti reali preservati
  - Eliminazione cascade implementata: appointments → messages → conversations → social_contacts → n8n_chat_histories
  - Rollback supportato via: SQL backup selettivo, pg_dump completo, Supabase PITR (se abilitato)
  - Statistiche pre/post-eliminazione integrate negli script per validazione

---

*Formato versione: Task X - Titolo - Data*
