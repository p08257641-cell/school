import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Find tables related to online classes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE '%class%' OR table_name ILIKE '%elearning%' OR table_name ILIKE '%jitsi%')
      ORDER BY table_name;
    `);

    console.log('📊 Related Tables:');
    console.log(tablesResult.rows);
    console.log();

    if (tablesResult.rows.length === 0) {
      console.log('ℹ️ No tables found. Listing all tables:');
      const allTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      console.log(allTables.rows.map(r => r.table_name).join('\n'));
      return;
    }

    // For each table, show its columns
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      console.log(`\n📋 Table: ${tableName}`);
      console.log('─'.repeat(60));
      
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      for (const col of columnsResult.rows) {
        console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      }

      // Check if 'channel' column exists
      const hasChannel = columnsResult.rows.some(c => c.column_name === 'channel');
      console.log(`\n  ${hasChannel ? '✓ HAS' : '✗ MISSING'} channel column`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
