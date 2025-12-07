# Security and Data Management

## Overview

This document outlines the security and data management decisions implemented in Chatly MVP, including token encryption, deletion strategies, storage formats, and vector embeddings.

**Last Updated:** 2025-12-06

---

## Table of Contents

1. [Hard Delete vs Soft Delete](#hard-delete-vs-soft-delete)
2. [Token Storage and Encryption](#token-storage-and-encryption)
3. [Storage Path Format](#storage-path-format)
4. [Vector Embeddings](#vector-embeddings)
5. [Best Practices](#best-practices)

---

## Hard Delete vs Soft Delete

### Implementation Choice: **HARD DELETE**

#### What is Hard Delete?
Hard delete permanently removes records from the database. Once deleted, data cannot be recovered unless restored from a backup.

```sql
-- Hard Delete Example
DELETE FROM platform_clients WHERE id = 123;
```

#### What is Soft Delete?
Soft delete marks records as deleted without physically removing them, typically using a `deleted_at` timestamp or `is_deleted` flag.

```sql
-- Soft Delete Example (NOT USED)
UPDATE platform_clients SET deleted_at = NOW() WHERE id = 123;
```

#### Why Hard Delete?

| Aspect | Reasoning |
|--------|-----------|
| **Data Privacy** | Comply with GDPR "right to be forgotten" - data must be permanently deleted when requested |
| **Database Performance** | No need to filter out soft-deleted records in every query |
| **Storage Costs** | Reduces database size by not keeping deleted records |
| **Simplicity** | Cleaner query logic without `WHERE deleted_at IS NULL` conditions |
| **Security** | Reduces attack surface by not keeping sensitive data |

#### Current Implementation

All DELETE operations in the application perform hard deletes:
- Platform clients
- Social contacts
- Messages
- Conversations
- Appointments
- **Platform tokens** (from Supabase Vault)

No `deleted_at` or `is_deleted` columns exist in any table.

---

## Token Storage and Encryption

### Implementation Choice: **ENCRYPTED TOKENS IN SUPABASE VAULT**

#### The Problem
Previously, OAuth tokens for WhatsApp, Instagram, and Messenger were stored as **plain text** in the database:

```sql
-- OLD SCHEMA (INSECURE - NO LONGER USED)
platform_clients (
  whatsapp_token TEXT,      -- Plain text token
  instagram_token TEXT,     -- Plain text token
  messenger_token TEXT      -- Plain text token
)
```

**Security Risks:**
- Database breach exposes all tokens
- Tokens visible in database backups
- Logs may inadvertently contain tokens
- Non-compliance with security best practices

#### The Solution: Supabase Vault

Supabase Vault provides encrypted secret storage using **pgsodium** (libsodium for PostgreSQL).

**New Schema:**
```sql
platform_clients (
  whatsapp_token_secret_id UUID,      -- Reference to encrypted secret
  instagram_token_secret_id UUID,     -- Reference to encrypted secret
  messenger_token_secret_id UUID      -- Reference to encrypted secret
)
```

#### How It Works

1. **Storage:** Token is encrypted and stored in `vault.secrets`
2. **Reference:** Only the UUID reference is stored in `platform_clients`
3. **Retrieval:** Token is decrypted on-demand via `vault.decrypted_secrets` view
4. **Deletion:** Hard delete removes secret from vault permanently

```typescript
// Example Usage (TypeScript)
import { storePlatformToken, getPlatformToken } from '@/lib/tokenManager'

// Store a token
const result = await storePlatformToken(123, 'whatsapp', 'EAABwz...')
if (result.success) {
  console.log('Token stored securely')
}

// Retrieve a token
const token = await getPlatformToken(123, 'whatsapp')
if (token.success && token.token) {
  // Use token for API calls
  makeWhatsAppRequest(token.token)
}
```

#### Database Functions

Four secure functions are provided:

| Function | Purpose | Example |
|----------|---------|---------|
| `store_platform_token()` | Create new encrypted token | `SELECT store_platform_token(123, 'whatsapp', 'token_value')` |
| `get_platform_token()` | Retrieve and decrypt token | `SELECT get_platform_token(123, 'whatsapp')` |
| `update_platform_token()` | Update existing token | `SELECT update_platform_token(123, 'whatsapp', 'new_token')` |
| `delete_platform_token()` | Permanently delete token | `SELECT delete_platform_token(123, 'whatsapp')` |

#### Security Features

- **Encryption at Rest:** All tokens encrypted with pgsodium
- **Access Control:** Functions use `SECURITY DEFINER` with proper RLS
- **Audit Trail:** Vault operations can be logged
- **Key Rotation:** Supabase manages encryption keys
- **No Plain Text:** Tokens never stored in plain text

#### Migration

The migration (`20251206_implement_secure_token_storage`) automatically:
1. Creates new `*_token_secret_id` columns
2. Migrates existing plain-text tokens to vault
3. Removes old plain-text token columns (hard delete)

---

## Storage Path Format

### Document and File Organization

Files uploaded to Supabase Storage follow a structured path format for organization and security:

```
{user_id}/{category}/{timestamp}_{filename}
```

**Example Paths:**
```
user-123/invoices/2024-01-15_fattura.pdf
user-123/contracts/2024-02-20_contratto_firmato.pdf
user-456/documents/2024-03-10_privacy_policy.pdf
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **User Isolation** | Each user's files in separate directory |
| **RLS Compatible** | Easy to implement Row Level Security policies |
| **Organized** | Files grouped by category |
| **No Conflicts** | Timestamp prevents filename collisions |
| **Scalable** | Works with millions of files |

### Implementation Example

```typescript
/**
 * Generate storage path for a file
 */
function generateStoragePath(
  userId: string,
  category: string,
  filename: string
): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${category}/${timestamp}_${sanitizedFilename}`
}

// Usage
const path = generateStoragePath('user-123', 'invoices', 'fattura.pdf')
// Result: user-123/invoices/2024-12-06_fattura.pdf
```

---

## Vector Embeddings

### Implementation: **1536-Dimensional Vectors**

#### Overview

The `documents` table uses **pgvector** for semantic search with AI-generated embeddings.

```sql
CREATE TABLE documents (
  id BIGINT PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding vector(1536),  -- 1536 dimensions
  platform_client_id BIGINT
);
```

#### Why 1536 Dimensions?

**OpenAI text-embedding-ada-002** generates embeddings with 1536 dimensions:

| Model | Dimensions | Cost | Use Case |
|-------|------------|------|----------|
| text-embedding-ada-002 | 1536 | Low | Production-grade semantic search |
| text-embedding-3-small | 1536 | Lower | Alternative, lower cost |
| text-embedding-3-large | 3072 | Higher | Higher accuracy (not used) |

**1536 dimensions** provides the best balance of:
- **Accuracy:** Excellent semantic similarity detection
- **Performance:** Fast vector similarity queries with HNSW index
- **Cost:** Economical for production use
- **Compatibility:** Standard industry embedding size

#### Usage Example

```typescript
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Store document with semantic search capability
 */
async function storeDocument(content: string, clientId: number) {
  // Generate embedding (1536 dimensions)
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: content,
  })

  const embedding = response.data[0].embedding

  // Store in database
  await supabase.from('documents').insert({
    content,
    embedding,
    platform_client_id: clientId,
    metadata: { created: new Date().toISOString() }
  })
}

/**
 * Search documents by semantic similarity
 */
async function searchDocuments(query: string, limit = 10) {
  // Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  })

  const queryEmbedding = response.data[0].embedding

  // Search using cosine similarity
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: limit,
  })

  return data
}
```

#### Index Configuration

For optimal performance, create an HNSW index:

```sql
CREATE INDEX documents_embedding_idx
ON documents
USING hnsw (embedding vector_cosine_ops);
```

**Performance Benefits:**
- Fast similarity search (< 100ms for millions of vectors)
- Low memory overhead
- Scalable to large datasets

---

## Best Practices

### Security

1. **Never log tokens:** Avoid logging token values in application logs
2. **Use HTTPS:** Always transmit tokens over encrypted connections
3. **Rotate tokens:** Implement token rotation for OAuth tokens
4. **Audit access:** Monitor who accesses encrypted tokens
5. **RLS policies:** Always use Row Level Security on sensitive tables

### Data Management

1. **Backup strategy:** Regular backups before hard deletes
2. **Audit trails:** Consider separate audit log for compliance
3. **Data retention:** Define and document retention policies
4. **GDPR compliance:** Document how to handle deletion requests

### Performance

1. **Index embeddings:** Always use HNSW or IVFFlat indexes for vectors
2. **Batch operations:** Use batch inserts for multiple documents
3. **Cache tokens:** Cache decrypted tokens temporarily (with caution)
4. **Optimize queries:** Use appropriate indexes on foreign keys

### Code Organization

```
src/
├── lib/
│   ├── tokenManager.ts        # Token encryption utilities
│   ├── supabase.ts            # Supabase client
│   └── security-utils.ts      # General security utilities
├── types/
│   └── database.types.ts      # Auto-generated DB types
└── docs/
    └── security-and-data-management.md  # This document
```

---

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2025-12-06 | `implement_secure_token_storage` | Migrated tokens to Supabase Vault |
| 2025-12-05 | `enable_realtime_on_tables` | Enabled real-time subscriptions |
| 2025-12-05 | `add_performance_indexes` | Added indexes for performance |

---

## Security Audit Checklist

Run this command to check for security advisories:

```bash
# Check security advisories
supabase db advisors --type security

# Check performance advisories
supabase db advisors --type performance
```

**Expected after implementation:**
- ✅ No plain-text tokens in database
- ✅ RLS policies enabled on all tables
- ✅ Encrypted storage for sensitive data
- ✅ Proper indexes for performance

---

## Additional Resources

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [GDPR Compliance Guide](https://gdpr.eu/right-to-be-forgotten/)

---

## Support

For questions about security implementation:
1. Check this document first
2. Review code in `src/lib/tokenManager.ts`
3. Consult Supabase Vault documentation
4. Contact security team for sensitive issues
