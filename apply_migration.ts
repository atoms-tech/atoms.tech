import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL\!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY\!;

if (\!supabaseUrl || \!supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = path.join(__dirname, 'supabase/migrations/20251108_fix_auth_type_constraint.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('Applying migration: 20251108_fix_auth_type_constraint.sql');
  console.log('SQL:', sql);
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('\nExecuting:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('✅ Success');
      }
    }
  }
}

applyMigration().catch(console.error);
