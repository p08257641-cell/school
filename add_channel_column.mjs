import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function addChannelColumn() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if channel column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'online_classes' AND column_name = 'channel';
    `);

    if (checkResult.rows.length > 0) {
      console.log('✓ channel column already exists');
      await client.end();
      return;
    }

    // Add channel column
    console.log('➕ Adding channel column to online_classes table...');
    await client.query(`
      ALTER TABLE online_classes
      ADD COLUMN channel character varying(255);
    `);
    console.log('✓ channel column added successfully\n');

    // Also add created_by and ensure other important columns exist
    const checkCreatedBy = await client.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'online_classes' AND column_name = 'created_by';
    `);

    if (checkCreatedBy.rows.length === 0) {
      console.log('➕ Adding created_by column...');
      await client.query(`
        ALTER TABLE online_classes
        ADD COLUMN created_by uuid;
      `);
      console.log('✓ created_by column added\n');
    }

    // Check final schema
    console.log('📋 Updated online_classes table schema:');
    const finalColumns = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'online_classes'
      ORDER BY ordinal_position;
    `);

    for (const col of finalColumns.rows) {
      console.log(`  • ${col.column_name}: ${col.data_type}`);
    }

  } catch (error) {
    if (error.code === '42701') {
      console.log('✓ channel column already exists (column already defined)');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.end();
  }
}

addChannelColumn();
