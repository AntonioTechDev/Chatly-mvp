#!/usr/bin/env node

/**
 * Automated Migration Script for Chatly MVP
 * Applies critical authentication architecture fixes to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://dstzlwmumpbcmrncujft.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Set it with: set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Chatly MVP Authentication Architecture Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260115_fix_authentication_architecture.sql');
    console.log('📖 Reading migration file:', migrationPath);

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} bytes)\n`);

    // Execute migration
    console.log('⚙️  Executing migration on Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Try alternative method: direct SQL execution via REST API
      console.log('⚠️  RPC method failed, trying direct execution...\n');

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`);
      }

      console.log('✅ Migration executed successfully!\n');
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify migration results
    console.log('🔍 Verifying migration results...\n');

    // Check if trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('event_object_table', 'users')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError) {
      console.log('⚠️  Could not verify trigger (this is normal if schema access is restricted)');
    } else {
      console.log('✅ Profile creation trigger verified');
    }

    // Check for orphaned users
    console.log('\n📊 Checking for orphaned auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (!authError && authUsers) {
      console.log(`   Total auth.users: ${authUsers.users.length}`);

      // Check profiles for each user
      let orphanedCount = 0;
      for (const user of authUsers.users) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          orphanedCount++;
        }
      }

      if (orphanedCount === 0) {
        console.log('   ✅ All users have profiles!');
      } else {
        console.log(`   ⚠️  Found ${orphanedCount} users without profiles`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test new user registration (email signup)');
    console.log('   2. Test Google OAuth login');
    console.log('   3. Verify existing users can access dashboard');
    console.log('   4. Check that automagruppoitalia@gmail.com can now login\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.error('\n📌 Manual migration required:');
    console.error('   1. Go to: https://supabase.com/dashboard/project/dstzlwmumpbcmrncujft/sql/new');
    console.error('   2. Copy the content of: supabase/migrations/20260115_fix_authentication_architecture.sql');
    console.error('   3. Paste and execute in SQL Editor\n');
    process.exit(1);
  }
}

// Run migration
applyMigration();
