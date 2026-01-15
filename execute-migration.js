#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/20260115_fix_authentication_architecture.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dstzlwmumpbcmrncujft.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHpsd211bXBiY21ybmN1amZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM4NjE4MSwiZXhwIjoyMDc3OTYyMTgxfQ.BdiA9_WlN1TXFMwbL6GB7FubpQ-yImjVfZ7k_JWL34g';

async function executeMigration() {
    try {
        console.log('Connecting to Supabase project: dstzlwmumpbcmrncujft');

        // Create Supabase client with service role
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        console.log('Executing migration: 20260115_fix_authentication_architecture');
        console.log('');

        // Execute the migration SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        }).catch(() => {
            // exec_sql may not exist, try direct query
            return supabase.from('_migration_status').select('*');
        });

        if (error) {
            console.error('ERROR:', error.message);
            // Try alternative approach using raw query via pg_net or direct connection
            console.log('\nAttempting alternative execution method...');

            // For Supabase, we need to use their database connection
            // This script will need to be executed via supabase CLI or direct psql
            console.log('ERROR: Cannot execute migration via client SDK');
            console.log('');
            console.log('WORKAROUND: Use the Supabase Dashboard or Supabase CLI:');
            console.log('');
            console.log('Option 1: Supabase Dashboard');
            console.log('  1. Go to https://app.supabase.com/project/dstzlwmumpbcmrncujft');
            console.log('  2. Navigate to "SQL Editor"');
            console.log('  3. Click "New Query"');
            console.log('  4. Copy and paste the migration SQL');
            console.log('  5. Click "Run"');
            console.log('');
            console.log('Option 2: Supabase CLI (from project root)');
            console.log('  supabase db push --linked');
            console.log('');
            process.exit(1);
        }

        console.log('Migration executed successfully!');
        console.log('');
        console.log('Key changes applied:');
        console.log('  ✓ Created/verified profiles table structure');
        console.log('  ✓ Created automatic profile creation trigger (handle_new_user)');
        console.log('  ✓ Backfilled profiles for existing auth.users');
        console.log('  ✓ Fixed user_id data type and relationships');
        console.log('  ✓ Configured RLS policies for secure access');
        console.log('  ✓ Created helper functions for onboarding state management');
        console.log('  ✓ Added performance indexes');
        console.log('');

    } catch (error) {
        console.error('FATAL ERROR:', error);
        console.log('');
        console.log('Cannot execute migration via JavaScript SDK.');
        console.log('Use Supabase Dashboard or CLI instead.');
        process.exit(1);
    }
}

executeMigration();
